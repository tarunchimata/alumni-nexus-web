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

class OAuth2Service {
  private readonly keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
  private readonly realm = import.meta.env.VITE_KEYCLOAK_REALM;
  private readonly clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
  private readonly redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;

  // Generate PKCE code verifier (128 character base64url string)
  private generateCodeVerifier(): string {
    const array = new Uint8Array(96);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 128);
  }

  // Generate SHA256 code challenge from verifier
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate secure random state for CSRF protection
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Build Keycloak authorization URL
  async buildAuthUrl(): Promise<string> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store PKCE parameters for later use
    localStorage.setItem('oauth2_code_verifier', codeVerifier);
    localStorage.setItem('oauth2_state', state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params}`;
  }

  // Initiate OAuth2 login flow
  async login(): Promise<void> {
    const authUrl = await this.buildAuthUrl();
    window.location.href = authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, state: string): Promise<TokenResponse> {
    // Validate state parameter
    const storedState = localStorage.getItem('oauth2_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter - potential CSRF attack');
    }

    const codeVerifier = localStorage.getItem('oauth2_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    // Clean up PKCE parameters
    localStorage.removeItem('oauth2_code_verifier');
    localStorage.removeItem('oauth2_state');

    const response = await fetch('/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirectUri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const tokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  // Store tokens securely in localStorage
  private storeTokens(tokens: TokenResponse): void {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    localStorage.setItem('oauth2_access_token', tokens.access_token);
    localStorage.setItem('oauth2_refresh_token', tokens.refresh_token);
    localStorage.setItem('oauth2_expires_at', expiresAt.toString());
  }

  // Get current access token (refresh if needed)
  async getAccessToken(): Promise<string | null> {
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
  }

  // Refresh access token using refresh token
  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('oauth2_refresh_token');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/oauth2/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
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

  // Get user information from backend
  async getUserInfo(): Promise<UserInfo | null> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch('/api/oauth2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
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
    const refreshToken = localStorage.getItem('oauth2_refresh_token');
    
    // Clear local tokens first
    this.clearTokens();

    // Notify backend about logout
    if (refreshToken) {
      try {
        await fetch('/api/oauth2/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Backend logout failed:', error);
      }
    }

    // Redirect to Keycloak logout
    const logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }

  // Clear all stored tokens
  private clearTokens(): void {
    localStorage.removeItem('oauth2_access_token');
    localStorage.removeItem('oauth2_refresh_token');
    localStorage.removeItem('oauth2_expires_at');
    localStorage.removeItem('oauth2_code_verifier');
    localStorage.removeItem('oauth2_state');
  }
}

export const oauth2Service = new OAuth2Service();
export default oauth2Service;