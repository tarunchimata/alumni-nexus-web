/**
 * Simplified Keycloak OAuth2 Authentication Service
 * Single file, direct integration, no complexity
 */

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
  schoolId?: string;
  avatar?: string;
  status?: string;
}

class AuthService {
  private readonly keycloakUrl = 'https://login.hostingmanager.in';
  private readonly realm = 'myschoolbuddies-realm';
  private readonly clientId = 'myschoolbuddies-client';
  private readonly redirectUri = `${window.location.origin}/auth/callback`;

  // Generate PKCE parameters
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Login flow
  async login(): Promise<void> {
    console.log('[Auth] Starting login...');

    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store for callback
    localStorage.setItem('auth_code_verifier', codeVerifier);
    localStorage.setItem('auth_state', state);

    // Build authorization URL
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
    console.log('[Auth] Redirecting to:', authUrl);
    
    window.location.href = authUrl;
  }

  // Handle callback
  async handleCallback(code: string, state?: string): Promise<boolean> {
    try {
      console.log('[Auth] Handling callback...', { code: !!code, state: !!state });

      // Validate state
      const storedState = localStorage.getItem('auth_state');
      if (state && storedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = localStorage.getItem('auth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      // Clean up stored values
      localStorage.removeItem('auth_state');
      localStorage.removeItem('auth_code_verifier');

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      
      // Store tokens
      this.storeTokens(tokens);
      
      console.log('[Auth] Login successful!');
      return true;
    } catch (error) {
      console.error('[Auth] Callback failed:', error);
      this.clearTokens();
      return false;
    }
  }

  // Exchange code for tokens
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    });

    console.log('[Auth] Exchanging code for tokens...');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Auth] Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  // Get user info
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const token = await this.getValidToken();
      if (!token) return null;

      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('[Auth] Failed to get user info:', response.status);
        return null;
      }

      const userInfo = await response.json();
      console.log('[Auth] User info retrieved:', userInfo);

      // Decode token to get roles
      const decodedToken = this.decodeJWT(token);
      const roles = decodedToken?.realm_access?.roles || [];
      
      // Determine primary role
      let role = 'student';
      if (roles.includes('platform_admin')) role = 'platform_admin';
      else if (roles.includes('school_admin')) role = 'school_admin';
      else if (roles.includes('teacher')) role = 'teacher';
      else if (roles.includes('alumni')) role = 'alumni';

      return {
        id: userInfo.sub,
        email: userInfo.email || '',
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        role,
        schoolId: decodedToken?.school_id,
        avatar: userInfo.picture,
      };
    } catch (error) {
      console.error('[Auth] Error getting user info:', error);
      return null;
    }
  }

  // Token management
  private storeTokens(tokens: TokenResponse): void {
    const expiresAt = Date.now() + (tokens.expires_in * 1000) - 60000; // 1 min buffer
    
    localStorage.setItem('auth_access_token', tokens.access_token);
    localStorage.setItem('auth_refresh_token', tokens.refresh_token);
    localStorage.setItem('auth_expires_at', expiresAt.toString());
  }

  private async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem('auth_access_token');
    const expiresAt = localStorage.getItem('auth_expires_at');

    if (!token) return null;

    // Check if token is expired
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      console.log('[Auth] Token expired, refreshing...');
      return await this.refreshToken();
    }

    return token;
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshTokenValue = localStorage.getItem('auth_refresh_token');
      if (!refreshTokenValue) return null;

      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshTokenValue,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('[Auth] Token refresh failed');
        this.clearTokens();
        return null;
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      console.error('[Auth] Refresh token error:', error);
      this.clearTokens();
      return null;
    }
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return !!token;
  }

  async logout(): Promise<void> {
    this.clearTokens();
    const logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }

  private clearTokens(): void {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_expires_at');
    localStorage.removeItem('auth_code_verifier');
    localStorage.removeItem('auth_state');
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[Auth] JWT decode error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export type { UserInfo, TokenResponse };