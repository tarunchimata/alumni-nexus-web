
// Enhanced OAuth2 service with proper session management
import { logger } from './utils/logger';

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
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private initialized = false;
  private userInfo: UserInfo | null = null;
  private accessToken: string | null = null;

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.isAuthenticated();
    }

    try {
      const isAuth = await this.checkAuthStatus();
      this.initialized = true;
      return isAuth;
    } catch (error) {
      console.error('[OAuth2] Initialization failed:', error);
      this.initialized = true;
      return false;
    }
  }

  private async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        this.userInfo = userInfo;
        this.accessToken = 'cookie-based'; // Placeholder since we use httpOnly cookies
        return true;
      }

      return false;
    } catch (error) {
      console.error('[OAuth2] Auth status check failed:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.initialized) {
      return await this.initialize();
    }

    // Check if we have user info cached
    if (this.userInfo) {
      return true;
    }

    // Recheck auth status
    return await this.checkAuthStatus();
  }

  async getUserInfo(): Promise<UserInfo | null> {
    if (!this.userInfo) {
      await this.checkAuthStatus();
    }
    return this.userInfo;
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      await this.checkAuthStatus();
    }
    return this.accessToken;
  }

  login(): void {
    const redirectUri = `${window.location.origin}/oauth2/callback`;
    const loginUrl = `${this.baseUrl}/api/oauth2/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[OAuth2] Logout failed:', error);
    } finally {
      this.userInfo = null;
      this.accessToken = null;
      this.initialized = false;
    }
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth2/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        await this.checkAuthStatus();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[OAuth2] Callback handling failed:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await this.checkAuthStatus();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[OAuth2] Token refresh failed:', error);
      return false;
    }
  }

  clearCache(): void {
    this.userInfo = null;
    this.accessToken = null;
    this.initialized = false;
  }
}

export const oauth2Service = new OAuth2Service();
