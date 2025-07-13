
import type { TokenResponse, UserInfo, KeycloakErrorResponse } from './types';
import { OAuth2ConfigService } from './config';
import { PKCEService } from './pkce';
import { OAuth2StorageService } from './storage';

export class OAuth2Service {
  private readonly config: OAuth2ConfigService;
  private readonly pkce: PKCEService;
  private readonly storage: OAuth2StorageService;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.config = new OAuth2ConfigService();
    this.pkce = new PKCEService();
    this.storage = new OAuth2StorageService();
  }

  private log(message: string, data?: any) {
    if (import.meta.env.DEV) {
      console.log(`[OAuth2] ${message}`, data || '');
    }
  }

  async buildAuthUrl(): Promise<string> {
    this.storage.clearOAuth2State();

    const codeVerifier = this.pkce.generateCodeVerifier();
    const codeChallenge = await this.pkce.generateCodeChallenge(codeVerifier);
    const state = this.pkce.generateState();

    this.storage.storeOAuth2State(codeVerifier, state);

    const params = new URLSearchParams({
      client_id: this.config.getClientId(),
      redirect_uri: this.config.getRedirectUriValue(),
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/auth?${params}`;
  }

  async login(): Promise<void> {
    try {
      const authUrl = await this.buildAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      this.log('Login initiation failed', error);
      throw error;
    }
  }

  async exchangeCodeForTokens(code: string, receivedState: string): Promise<TokenResponse> {
    const { state: storedState, codeVerifier } = this.storage.getOAuth2State();

    if (!storedState || !receivedState || storedState !== receivedState) {
      this.storage.clearOAuth2State();
      throw new Error('Authentication state mismatch detected. Please try logging in again.');
    }

    if (!codeVerifier) {
      throw new Error('Authentication parameters missing. Please try logging in again.');
    }

    this.storage.clearOAuth2State();

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.getClientId(),
      client_secret: this.config.getClientSecretValue(),
      code,
      redirect_uri: this.config.getRedirectUriValue(),
      code_verifier: codeVerifier,
    });

    const keycloakTokenUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/token`;

    try {
      const response = await fetch(keycloakTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams.toString(),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorDetails: KeycloakErrorResponse;
        try {
          errorDetails = JSON.parse(responseText);
        } catch (parseError) {
          errorDetails = { error: 'parse_error', error_description: responseText };
        }

        const errorMessage = this.getErrorMessage(response.status, errorDetails);
        throw new Error(errorMessage);
      }

      const tokens: TokenResponse = JSON.parse(responseText);
      this.storage.storeTokens(tokens);
      return tokens;

    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to Keycloak server. Please check your connection.');
      }
      throw fetchError;
    }
  }

  private getErrorMessage(status: number, error: KeycloakErrorResponse): string {
    const baseMessage = `Keycloak authentication failed: ${status}`;
    
    switch (error.error) {
      case 'invalid_client':
        return `${baseMessage} - Invalid client configuration. Please check client_id: ${this.config.getClientId()}`;
      case 'invalid_grant':
        return `${baseMessage} - Invalid authorization code or expired session. Please try logging in again.`;
      case 'invalid_request':
        return `${baseMessage} - Invalid request parameters. Please check redirect_uri: ${this.config.getRedirectUriValue()}`;
      case 'unsupported_grant_type':
        return `${baseMessage} - Authorization code grant type not supported for this client.`;
      default:
        return `${baseMessage} - ${error.error_description || error.error || 'Unknown error'}`;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const token = this.storage.getAccessToken();
      
      if (!token) {
        return null;
      }

      if (this.storage.isTokenExpired()) {
        return await this.refreshToken();
      }

      return token;
    } catch (error) {
      this.log('Error getting access token', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshTokenValue = this.storage.getRefreshToken();
      if (!refreshTokenValue) {
        return null;
      }

      const refreshUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/token`;

      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.getClientId(),
        client_secret: this.config.getClientSecretValue(),
        refresh_token: refreshTokenValue,
      });

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: refreshParams.toString(),
      });

      if (!response.ok) {
        this.storage.clearTokens();
        return null;
      }

      const tokens = await response.json();
      this.storage.storeTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.storage.clearTokens();
      return null;
    }
  }

  async getUserInfo(): Promise<UserInfo | null> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const userInfoUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/userinfo`;
      
      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const keycloakUser = await response.json();
      
      const decodedToken = this.decodeJWT(token);
      const roles = decodedToken?.realm_access?.roles || [];
      
      let primaryRole = 'student';
      if (roles.includes('platform_admin')) {
        primaryRole = 'platform_admin';
      } else if (roles.includes('school_admin')) {
        primaryRole = 'school_admin';
      } else if (roles.includes('teacher')) {
        primaryRole = 'teacher';
      } else if (roles.includes('alumni')) {
        primaryRole = 'alumni';
      }

      const userInfo = {
        id: keycloakUser.sub,
        email: keycloakUser.email,
        firstName: keycloakUser.given_name || '',
        lastName: keycloakUser.family_name || '',
        role: primaryRole,
        roles: roles,
        schoolId: decodedToken?.school_id || keycloakUser.school_id,
        avatar: keycloakUser.picture,
      };

      return userInfo;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async logout(): Promise<void> {
    this.storage.clearTokens();
    this.storage.clearOAuth2State();
    
    const logoutUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }
}
