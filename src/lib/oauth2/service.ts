
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

    const authUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/auth?${params}`;
    
    this.log('Building OAuth2 authorization URL', {
      keycloakUrl: this.config.getKeycloakUrl(),
      realm: this.config.getRealm(),
      clientId: this.config.getClientId(),
      redirectUri: this.config.getRedirectUriValue(),
      authUrl: authUrl.substring(0, 100) + '...'
    });

    return authUrl;
  }

  async login(): Promise<void> {
    try {
      this.log('Initiating OAuth2 login flow');
      const authUrl = await this.buildAuthUrl();
      this.log('Redirecting to Keycloak login page', { url: authUrl.substring(0, 100) + '...' });
      window.location.href = authUrl;
    } catch (error) {
      this.log('Login initiation failed', error);
      console.error('[OAuth2] Login failed:', error);
      throw error;
    }
  }

  async handleCallback(code: string, receivedState?: string): Promise<boolean> {
    try {
      this.log('Handling OAuth2 callback', { hasCode: !!code, hasState: !!receivedState });
      
      if (receivedState) {
        const { state: storedState } = this.storage.getOAuth2State();
        if (!storedState || storedState !== receivedState) {
          this.log('State mismatch detected', { received: receivedState, stored: storedState });
          throw new Error('State mismatch - possible security issue');
        }
      }

      const tokens = await this.exchangeCodeForTokens(code, receivedState || '');
      this.log('Token exchange successful', { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token 
      });

      // Store tokens properly
      this.storage.storeTokens(tokens);
      
      return true;
    } catch (error) {
      this.log('Callback handling failed', error);
      console.error('[OAuth2] Callback failed:', error);
      // Clear state on error
      this.storage.clearOAuth2State();
      return false;
    }
  }

  async exchangeCodeForTokens(code: string, receivedState: string): Promise<TokenResponse> {
    const { state: storedState, codeVerifier } = this.storage.getOAuth2State();

    if (receivedState && (!storedState || storedState !== receivedState)) {
      this.storage.clearOAuth2State();
      throw new Error('Authentication state mismatch detected. Please try logging in again.');
    }

    if (!codeVerifier) {
      throw new Error('Authentication parameters missing. Please try logging in again.');
    }

    this.storage.clearOAuth2State();

    // Use our backend API endpoint instead of calling Keycloak directly
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3033/api';
    const tokenUrl = `${apiBaseUrl}/oauth2/token`;

    const tokenData = {
      code,
      code_verifier: codeVerifier,
      redirectUri: this.config.getRedirectUriValue(),
    };

    this.log('Exchanging authorization code for tokens via backend API', {
      tokenUrl,
      redirectUri: this.config.getRedirectUriValue()
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorDetails: KeycloakErrorResponse;
        try {
          errorDetails = JSON.parse(responseText);
        } catch (parseError) {
          errorDetails = { error: 'parse_error', error_description: responseText };
        }

        this.log('Token exchange failed', { status: response.status, error: errorDetails });
        const errorMessage = this.getErrorMessage(response.status, errorDetails);
        throw new Error(errorMessage);
      }

      const tokens: TokenResponse = JSON.parse(responseText);
      this.storage.storeTokens(tokens);
      this.log('Tokens stored successfully');
      return tokens;

    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to backend server. Please check your connection.');
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
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.log('[OAuth2] No access token available');
        return null;
      }

      // Use backend API endpoint for user info
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3033/api';
      const userInfoUrl = `${apiBaseUrl}/oauth2/userinfo`;

      this.log('Fetching user info via backend API', { userInfoUrl });

      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[OAuth2] Failed to fetch user info:', response.status);
        return null;
      }

      const userInfo = await response.json();
      console.log('[OAuth2] User info received from backend:', userInfo);

      return {
        id: userInfo.id,
        email: userInfo.email || '',
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        role: userInfo.role || 'student',
        roles: userInfo.roles || [],
        schoolId: userInfo.schoolId,
        avatar: userInfo.profilePictureUrl,
      };
    } catch (error) {
      console.error('[OAuth2] Error getting user info:', error);
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

  async initialize(): Promise<boolean> {
    try {
      this.log('Initializing OAuth2 service');
      
      // Initialize configuration first
      await this.config.initialize();
      
      const isAuth = await this.isAuthenticated();
      this.log('OAuth2 initialization complete', { isAuthenticated: isAuth });
      return isAuth;
    } catch (error) {
      this.log('OAuth2 initialization failed', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async logout(): Promise<void> {
    this.log('Logging out user');
    this.storage.clearTokens();
    this.storage.clearOAuth2State();
    
    const logoutUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    this.log('Redirecting to Keycloak logout', { logoutUrl });
    window.location.href = logoutUrl;
  }

  clearCache(): void {
    this.storage.clearTokens();
    this.storage.clearOAuth2State();
  }
}
