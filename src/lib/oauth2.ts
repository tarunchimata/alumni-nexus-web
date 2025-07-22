import axios from 'axios';

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  status?: string;
  avatar?: string;
}

class OAuth2Service {
  private userInfoCache: UserInfo | null = null;
  private accessTokenCache: string | null = null;
  private baseApiUrl: string;

  constructor() {
    this.baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  async initialize(): Promise<boolean> {
    console.log('[OAuth2] Initializing authentication...');
    return await this.isAuthenticated();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async getUserInfo(): Promise<UserInfo | null> {
    if (this.userInfoCache) {
      return this.userInfoCache;
    }

    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const response = await axios.get(`${this.baseApiUrl}/api/oauth2/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.userInfoCache = response.data;
      return response.data;
    } catch (error) {
      console.error('[OAuth2] Failed to get user info:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenCache) {
      return this.accessTokenCache;
    }

    const storedToken = localStorage.getItem('oauth2_access_token');
    if (storedToken && !this.isTokenExpired()) {
      this.accessTokenCache = storedToken;
      return storedToken;
    }

    return null;
  }

  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    localStorage.setItem('oauth2_code_verifier', codeVerifier);
    localStorage.setItem('oauth2_state', state);

    const authParams = new URLSearchParams({
      client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_OAUTH2_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/auth?${authParams}`;
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state?: string): Promise<boolean> {
    try {
      const codeVerifier = localStorage.getItem('oauth2_code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      const response = await axios.post(`${this.baseApiUrl}/api/oauth2/token`, {
        code,
        code_verifier: codeVerifier,
        redirectUri: import.meta.env.VITE_OAUTH2_REDIRECT_URI
      });

      const tokens = response.data;
      localStorage.setItem('oauth2_access_token', tokens.access_token);
      localStorage.setItem('oauth2_refresh_token', tokens.refresh_token);
      localStorage.setItem('oauth2_expires_at', (Date.now() + (tokens.expires_in * 1000)).toString());

      localStorage.removeItem('oauth2_code_verifier');
      localStorage.removeItem('oauth2_state');

      this.accessTokenCache = tokens.access_token;
      return true;
    } catch (error) {
      console.error('[OAuth2] Callback failed:', error);
      this.clearCache();
      return false;
    }
  }

  async logout(): Promise<void> {
    this.clearCache();
    const logoutUrl = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }

  clearCache(): void {
    this.userInfoCache = null;
    this.accessTokenCache = null;
    localStorage.removeItem('oauth2_access_token');
    localStorage.removeItem('oauth2_refresh_token');
    localStorage.removeItem('oauth2_expires_at');
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('oauth2_expires_at');
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt) - 300000; // 5 min buffer
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!)).replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!)).replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!)).replace(/=/g, '');
  }
}

export const oauth2Service = new OAuth2Service();