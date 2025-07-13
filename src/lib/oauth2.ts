// OAuth2 + PKCE implementation for Keycloak authentication

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];
  schoolId?: string;
  avatar?: string;
}

interface KeycloakErrorResponse {
  error: string;
  error_description?: string;
}

class OAuth2Service {
  private readonly keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
  private readonly realm = import.meta.env.VITE_KEYCLOAK_REALM;
  private readonly clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
  
  // Fixed redirect URI for Lovable preview environment
  private get redirectUri(): string {
    const envRedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
    const defaultRedirectUri = 'https://preview--alumni-nexus-web.lovable.app/oauth2/callback';
    
    return envRedirectUri || defaultRedirectUri;
  }

  // Enhanced logging for OAuth2 flow with detailed debugging
  private log(message: string, data?: any) {
    console.log(`[OAuth2] ${message}`, data || '');
  }

  constructor() {
    this.validateConfiguration();
    this.log('OAuth2Service initialized with configuration:', {
      keycloakUrl: this.keycloakUrl,
      realm: this.realm,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      environment: import.meta.env.MODE
    });
  }

  // Validate all required environment variables
  private validateConfiguration(): void {
    const requiredVars = {
      VITE_KEYCLOAK_URL: this.keycloakUrl,
      VITE_KEYCLOAK_REALM: this.realm,
      VITE_KEYCLOAK_CLIENT_ID: this.clientId
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(', ')}`;
      this.log('ERROR: Configuration validation failed', { missing, current: requiredVars });
      throw new Error(error);
    }

    this.log('Configuration validation successful', requiredVars);
  }

  // Generate PKCE code verifier (128 character base64url string)
  private generateCodeVerifier(): string {
    const array = new Uint8Array(96);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 128);
    
    this.log('Generated code verifier', { length: verifier.length, preview: verifier.substring(0, 10) + '...' });
    return verifier;
  }

  // Generate SHA256 code challenge from verifier
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    this.log('Generated code challenge', { 
      verifierPreview: verifier.substring(0, 10) + '...',
      challengePreview: challenge.substring(0, 10) + '...'
    });
    return challenge;
  }

  // Generate secure random state for CSRF protection
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    this.log('Generated state parameter', { length: state.length, preview: state.substring(0, 10) + '...' });
    return state;
  }

  // Clear OAuth2 state and parameters
  private clearOAuth2State(): void {
    this.log('Clearing OAuth2 state parameters');
    try {
      localStorage.removeItem('oauth2_code_verifier');
      localStorage.removeItem('oauth2_state');
      localStorage.removeItem('oauth2_login_timestamp');
    } catch (error) {
      this.log('Warning: Could not clear localStorage', error);
    }
  }

  // Build Keycloak authorization URL
  async buildAuthUrl(): Promise<string> {
    this.clearOAuth2State();

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();
    const timestamp = Date.now().toString();

    // Store PKCE parameters for later use
    try {
      localStorage.setItem('oauth2_code_verifier', codeVerifier);
      localStorage.setItem('oauth2_state', state);
      localStorage.setItem('oauth2_login_timestamp', timestamp);
      
      this.log('Stored OAuth2 parameters in localStorage successfully', {
        codeVerifierStored: !!localStorage.getItem('oauth2_code_verifier'),
        stateStored: !!localStorage.getItem('oauth2_state'),
        timestampStored: !!localStorage.getItem('oauth2_login_timestamp')
      });
    } catch (error) {
      this.log('ERROR: Failed to store OAuth2 parameters', error);
      throw new Error('Could not store OAuth2 parameters. Please check browser storage permissions.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params}`;
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
    const storedState = localStorage.getItem('oauth2_state');
    const storedTimestamp = localStorage.getItem('oauth2_login_timestamp');
    const codeVerifier = localStorage.getItem('oauth2_code_verifier');

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
      this.clearOAuth2State();
      throw new Error('Authentication state mismatch detected. Please try logging in again.');
    }

    // Timestamp validation (30 minutes max)
    if (storedTimestamp) {
      const loginAge = Date.now() - parseInt(storedTimestamp);
      if (loginAge > 30 * 60 * 1000) {
        this.log('❌ LOGIN SESSION EXPIRED', { ageInMinutes: loginAge / 60000 });
        this.clearOAuth2State();
        throw new Error('Login session expired. Please try logging in again.');
      }
    }

    if (!codeVerifier) {
      this.log('❌ CODE VERIFIER MISSING');
      throw new Error('Authentication parameters missing. Please try logging in again.');
    }

    this.log('✅ All validations passed, proceeding with token exchange');
    this.clearOAuth2State();

    // Prepare token exchange request
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    });

    const keycloakTokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    this.log('🔄 TOKEN EXCHANGE REQUEST DETAILS', {
      url: keycloakTokenUrl,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code: code.substring(0, 10) + '...',
        redirect_uri: this.redirectUri,
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
      
      this.storeTokens(tokens);
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
        return `${baseMessage} - Invalid client configuration. Please check client_id: ${this.clientId}`;
      case 'invalid_grant':
        return `${baseMessage} - Invalid authorization code or expired session. Please try logging in again.`;
      case 'invalid_request':
        return `${baseMessage} - Invalid request parameters. Please check redirect_uri: ${this.redirectUri}`;
      case 'unsupported_grant_type':
        return `${baseMessage} - Authorization code grant type not supported for this client.`;
      default:
        return `${baseMessage} - ${error.error_description || error.error || 'Unknown error'}`;
    }
  }

  // Store tokens securely in localStorage
  private storeTokens(tokens: TokenResponse): void {
    try {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('oauth2_access_token', tokens.access_token);
      localStorage.setItem('oauth2_refresh_token', tokens.refresh_token);
      localStorage.setItem('oauth2_expires_at', expiresAt.toString());
      
      this.log('✅ Tokens stored successfully', {
        accessTokenLength: tokens.access_token.length,
        refreshTokenLength: tokens.refresh_token.length,
        expiresAt: new Date(expiresAt).toISOString()
      });
    } catch (error) {
      this.log('❌ Error storing tokens', error);
      throw new Error('Could not store authentication tokens. Please check browser storage permissions.');
    }
  }

  // Get current access token (refresh if needed)
  async getAccessToken(): Promise<string | null> {
    try {
      const token = localStorage.getItem('oauth2_access_token');
      const expiresAt = localStorage.getItem('oauth2_expires_at');

      if (!token || !expiresAt) {
        return null;
      }

      // Check if token is expired (with 5 minute buffer)
      if (Date.now() > (parseInt(expiresAt) - 300000)) {
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
      const refreshToken = localStorage.getItem('oauth2_refresh_token');
      if (!refreshToken) {
        return null;
      }

      const refreshUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
      this.log('Making refresh token request', { refreshUrl });

      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
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
        this.clearTokens();
        return null;
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
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
      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
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
    this.clearTokens();
    this.clearOAuth2State();
    window.location.href = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
  }

  // Clear all stored tokens
  private clearTokens(): void {
    try {
      localStorage.removeItem('oauth2_access_token');
      localStorage.removeItem('oauth2_refresh_token');
      localStorage.removeItem('oauth2_expires_at');
      localStorage.removeItem('oauth2_code_verifier');
      localStorage.removeItem('oauth2_state');
    } catch (error) {
      this.log('Warning: Could not clear tokens from localStorage', error);
    }
  }
}

export const oauth2Service = new OAuth2Service();
export default oauth2Service;
