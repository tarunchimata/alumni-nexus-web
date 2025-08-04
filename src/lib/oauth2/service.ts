
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
    const timestamp = new Date().toISOString();
    console.log(`[OAuth2Service ${timestamp}] ${message}`, data || '');
  }

  private logError(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[OAuth2Service ERROR ${timestamp}] ${message}`, error || '');
  }

  private debugLog(step: string, details: any) {
    console.group(`[OAuth2 DEBUG] ${step}`);
    console.log('Details:', details);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment:', {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      origin: window.location.origin,
      protocol: window.location.protocol
    });
    console.groupEnd();
  }

  async buildAuthUrl(): Promise<string> {
    this.storage.clearOAuth2State();

    const codeVerifier = this.pkce.generateCodeVerifier();
    const codeChallenge = await this.pkce.generateCodeChallenge(codeVerifier);
    const state = this.pkce.generateState();

    this.storage.storeOAuth2State(codeVerifier, state);

    // Get redirect URI based on current domain
    const redirectUri = this.getRedirectUri();

    const params = new URLSearchParams({
      client_id: this.config.getClientId(),
      redirect_uri: redirectUri,
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
      redirectUri,
      authUrl: authUrl.substring(0, 100) + '...'
    });

    return authUrl;
  }

  private getRedirectUri(): string {
    // Use the configured redirect URI from environment
    const configuredRedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
    
    // For development, prefer localhost over IP addresses for consistency
    if (import.meta.env.DEV) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:8080/auth/callback`;
      }
      // If running on IP, use that but ensure port consistency
      if (window.location.hostname === '192.168.1.99') {
        return `http://192.168.1.99:8080/auth/callback`;
      }
    }
    
    // Use configured redirect URI or current origin as fallback
    return configuredRedirectUri || `${window.location.origin}/auth/callback`;
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
    this.debugLog('Token Exchange Start', {
      hasCode: !!code,
      codeLength: code?.length,
      receivedState,
      timestamp: new Date().toISOString()
    });

    const { state: storedState, codeVerifier } = this.storage.getOAuth2State();

    this.debugLog('State Validation', {
      hasStoredState: !!storedState,
      hasReceivedState: !!receivedState,
      statesMatch: storedState === receivedState,
      storedState: storedState?.substring(0, 10) + '...',
      receivedState: receivedState?.substring(0, 10) + '...'
    });

    if (receivedState && (!storedState || storedState !== receivedState)) {
      this.storage.clearOAuth2State();
      this.logError('Authentication state mismatch detected', {
        stored: storedState,
        received: receivedState
      });
      throw new Error('Authentication state mismatch detected. Please try logging in again.');
    }

    if (!codeVerifier) {
      this.logError('Code verifier missing from storage');
      throw new Error('Authentication parameters missing. Please try logging in again.');
    }

    this.storage.clearOAuth2State();

    // Use our backend API endpoint instead of calling Keycloak directly
    // Use HTTPS backend URL when available to avoid mixed content issues
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
    const fallbackApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3033/api';
    const apiBaseUrl = backendApiUrl || fallbackApiUrl;
    const tokenUrl = `${apiBaseUrl}/oauth2/token`;
    const redirectUri = this.getRedirectUri();

    const tokenData = {
      code,
      code_verifier: codeVerifier,
      redirectUri,
    };

    this.debugLog('Token Exchange Request Setup', {
      tokenUrl,
      redirectUri,
      hasCode: !!code,
      codeLength: code?.length,
      hasCodeVerifier: !!codeVerifier,
      codeVerifierLength: codeVerifier?.length,
      backendApiUrl,
      fallbackApiUrl,
      selectedApiUrl: apiBaseUrl,
      currentOrigin: window.location.origin,
      currentHost: window.location.host,
      isHTTPS: window.location.protocol === 'https:',
      environmentVars: {
        VITE_BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL,
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL,
        VITE_OAUTH2_REDIRECT_URI: import.meta.env.VITE_OAUTH2_REDIRECT_URI
      }
    });

    try {
      this.log('Making token exchange request to backend...');
      
      const startTime = performance.now();
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });
      const endTime = performance.now();

      this.debugLog('Token Exchange Response Received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        type: response.type,
        redirected: response.redirected,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime: `${(endTime - startTime).toFixed(2)}ms`
      });

      const responseText = await response.text();
      
      this.debugLog('Response Body', {
        hasContent: !!responseText,
        contentLength: responseText?.length,
        contentPreview: responseText?.substring(0, 200) + (responseText?.length > 200 ? '...' : '')
      });

      if (!response.ok) {
        let errorDetails: KeycloakErrorResponse;
        try {
          errorDetails = JSON.parse(responseText);
        } catch (parseError) {
          this.logError('Failed to parse error response as JSON', parseError);
          errorDetails = { error: 'parse_error', error_description: responseText };
        }

        this.logError('Token exchange failed with error response', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          responseUrl: response.url,
          fullResponse: responseText
        });
        
        const errorMessage = this.getErrorMessage(response.status, errorDetails);
        throw new Error(errorMessage);
      }

      const tokens: TokenResponse = JSON.parse(responseText);
      this.storage.storeTokens(tokens);
      
      this.debugLog('Token Exchange Success', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        accessTokenPreview: tokens.access_token?.substring(0, 50) + '...'
      });

      return tokens;

    } catch (fetchError) {
      this.logError('Token exchange request failed', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        tokenUrl,
        redirectUri,
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        cause: fetchError instanceof Error ? (fetchError as any).cause : undefined
      });
      
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
        return `${baseMessage} - Invalid request parameters. Please check redirect_uri: ${this.getRedirectUri()}`;
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
      // Use HTTPS backend URL when available to avoid mixed content issues
      const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
      const fallbackApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3033/api';
      const apiBaseUrl = backendApiUrl || fallbackApiUrl;
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
