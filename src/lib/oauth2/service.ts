
import type { TokenResponse, UserInfo, KeycloakErrorResponse } from './types';
import { OAuth2ConfigService } from './config';
import { PKCEService } from './pkce';
import { OAuth2StorageService } from './storage';

export class OAuth2Service {
  private readonly config: OAuth2ConfigService;
  private readonly pkce: PKCEService;
  private readonly storage: OAuth2StorageService;

  constructor() {
    this.config = new OAuth2ConfigService();
    this.pkce = new PKCEService();
    this.storage = new OAuth2StorageService();
  }

  // Enhanced logging for OAuth2 flow with detailed debugging
  private log(message: string, data?: any) {
    console.log(`[OAuth2] ${message}`, data || '');
  }

  // Build Keycloak authorization URL
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
    this.log('Built authorization URL', { 
      url: authUrl.substring(0, 100) + '...',
      params: Object.fromEntries(params.entries())
    });
    
    return authUrl;
  }

  // Initiate OAuth2 login flow
  async login(): Promise<void> {
    this.log('Initiating OAuth2 login flow');
    try {
      const authUrl = await this.buildAuthUrl();
      this.log('Redirecting to Keycloak authorization endpoint');
      window.location.href = authUrl;
    } catch (error) {
      this.log('ERROR: Login initiation failed', error);
      throw error;
    }
  }

  // Exchange authorization code for tokens with comprehensive debugging
  async exchangeCodeForTokens(code: string, receivedState: string): Promise<TokenResponse> {
    this.log('🚀 STARTING TOKEN EXCHANGE DEBUG SESSION', {
      codeLength: code?.length || 0,
      codePreview: code?.substring(0, 10) + '...' || 'undefined',
      receivedState: receivedState?.substring(0, 10) + '...' || 'undefined'
    });

    // Validate and retrieve stored parameters
    const { state: storedState, timestamp: storedTimestamp, codeVerifier } = this.storage.getOAuth2State();

    this.log('📋 STORED PARAMETERS VALIDATION', {
      hasStoredState: !!storedState,
      hasReceivedState: !!receivedState,
      statesMatch: storedState === receivedState,
      hasCodeVerifier: !!codeVerifier,
      hasTimestamp: !!storedTimestamp,
      storedStatePreview: storedState?.substring(0, 10) + '...' || 'null',
      codeVerifierPreview: codeVerifier?.substring(0, 10) + '...' || 'null'
    });

    // State validation
    if (!storedState || !receivedState || storedState !== receivedState) {
      this.log('❌ STATE VALIDATION FAILED');
      this.storage.clearOAuth2State();
      throw new Error('Authentication state mismatch detected. Please try logging in again.');
    }

    // Timestamp validation (30 minutes max)
    if (storedTimestamp) {
      const loginAge = Date.now() - parseInt(storedTimestamp);
      if (loginAge > 30 * 60 * 1000) {
        this.log('❌ LOGIN SESSION EXPIRED', { ageInMinutes: loginAge / 60000 });
        this.storage.clearOAuth2State();
        throw new Error('Login session expired. Please try logging in again.');
      }
    }

    if (!codeVerifier) {
      this.log('❌ CODE VERIFIER MISSING');
      throw new Error('Authentication parameters missing. Please try logging in again.');
    }

    this.log('✅ All validations passed, proceeding with token exchange');
    this.storage.clearOAuth2State();

    // Prepare token exchange request with client secret
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.getClientId(),
      client_secret: this.config.getClientSecret(),
      code,
      redirect_uri: this.config.getRedirectUriValue(),
      code_verifier: codeVerifier,
    });

    const keycloakTokenUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/token`;

    this.log('🔄 TOKEN EXCHANGE REQUEST DETAILS', {
      url: keycloakTokenUrl,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        grant_type: 'authorization_code',
        client_id: this.config.getClientId(),
        client_secret: '[PRESENT]',
        code: code.substring(0, 10) + '...',
        redirect_uri: this.config.getRedirectUriValue(),
        code_verifier: codeVerifier.substring(0, 10) + '...',
      }
    });

    try {
      const response = await fetch(keycloakTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams.toString(),
      });

      this.log('📥 KEYCLOAK TOKEN RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type'),
          'cache-control': response.headers.get('cache-control'),
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        }
      });

      const responseText = await response.text();
      this.log('📄 RAW RESPONSE BODY', { 
        body: responseText,
        length: responseText.length 
      });

      if (!response.ok) {
        let errorDetails: KeycloakErrorResponse;
        try {
          errorDetails = JSON.parse(responseText);
          this.log('❌ KEYCLOAK ERROR RESPONSE PARSED', errorDetails);
        } catch (parseError) {
          this.log('❌ FAILED TO PARSE ERROR RESPONSE', { parseError, responseText });
          errorDetails = { error: 'parse_error', error_description: responseText };
        }

        const errorMessage = this.getErrorMessage(response.status, errorDetails);
        this.log('❌ TOKEN EXCHANGE FAILED', { 
          status: response.status,
          error: errorDetails.error,
          description: errorDetails.error_description,
          finalErrorMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      let tokens: TokenResponse;
      try {
        tokens = JSON.parse(responseText);
        this.log('✅ TOKEN EXCHANGE SUCCESSFUL', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in
        });
      } catch (parseError) {
        this.log('❌ FAILED TO PARSE SUCCESS RESPONSE', { parseError, responseText });
        throw new Error('Invalid response format from Keycloak server');
      }
      
      this.storage.storeTokens(tokens);
      return tokens;

    } catch (fetchError) {
      this.log('❌ NETWORK ERROR DURING TOKEN EXCHANGE', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      });
      
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to Keycloak server. Please check your connection.');
      }
      throw fetchError;
    }
  }

  // Get specific error message based on Keycloak error response
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

  // Get current access token (refresh if needed)
  async getAccessToken(): Promise<string | null> {
    try {
      const token = this.storage.getAccessToken();
      
      if (!token) {
        return null;
      }

      // Check if token is expired (with 5 minute buffer)
      if (this.storage.isTokenExpired()) {
        return await this.refreshToken();
      }

      return token;
    } catch (error) {
      this.log('Error getting access token', error);
      return null;
    }
  }

  // Refresh access token using refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshTokenValue = this.storage.getRefreshToken();
      if (!refreshTokenValue) {
        return null;
      }

      const refreshUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/token`;
      this.log('Making refresh token request', { refreshUrl });

      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.getClientId(),
        client_secret: this.config.getClientSecret(),
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

  // Get user information directly from Keycloak
  async getUserInfo(): Promise<UserInfo | null> {
    const token = await this.getAccessToken();
    if (!token) {
      this.log('No access token available for user info request');
      return null;
    }

    try {
      const userInfoUrl = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/userinfo`;
      this.log('Making direct user info request to Keycloak', { userInfoUrl });
      
      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      this.log('Keycloak user info response received', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        this.log('User info request failed', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const keycloakUser = await response.json();
      
      // Decode JWT to get roles
      const decodedToken = this.decodeJWT(token);
      const roles = decodedToken?.realm_access?.roles || [];
      
      // Determine primary role based on hierarchy
      let primaryRole = 'student'; // default
      if (roles.includes('platform_admin')) {
        primaryRole = 'platform_admin';
      } else if (roles.includes('school_admin')) {
        primaryRole = 'school_admin';
      } else if (roles.includes('teacher')) {
        primaryRole = 'teacher';
      } else if (roles.includes('alumni')) {
        primaryRole = 'alumni';
      }

      // Format user info response
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

      this.log('User info retrieved successfully', {
        userId: userInfo.id,
        email: userInfo.email,
        role: userInfo.role
      });

      return userInfo;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  // Simple JWT decoder (for client-side role extraction)
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      this.log('JWT decode error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Logout user
  async logout(): Promise<void> {
    this.storage.clearTokens();
    this.storage.clearOAuth2State();
    window.location.href = `${this.config.getKeycloakUrl()}/realms/${this.config.getRealm()}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
  }
}
