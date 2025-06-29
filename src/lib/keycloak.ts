
// Keycloak integration utilities
// This file contains the configuration and utilities for Keycloak integration

export const keycloakConfig = {
  url: 'https://login.hostingmanager.in',
  realm: 'myschoolbuddies-realm',
  clientId: 'frontend-client',
};

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  schoolId?: string;
}

export class KeycloakService {
  private static instance: KeycloakService;
  private keycloak: any = null;
  private initialized = false;

  static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService();
    }
    return KeycloakService.instance;
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // This would normally use the keycloak-js library
      // For now, we'll use a mock implementation
      console.log('Initializing Keycloak with config:', keycloakConfig);
      
      // Mock initialization
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      return false;
    }
  }

  async login(): Promise<void> {
    try {
      // Redirect to Keycloak login
      const loginUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
      const params = new URLSearchParams({
        client_id: keycloakConfig.clientId,
        response_type: 'code',
        scope: 'openid profile email',
        redirect_uri: window.location.origin + '/auth/callback',
        state: Math.random().toString(36).substring(7),
      });

      window.location.href = `${loginUrl}?${params.toString()}`;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const logoutUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
      const params = new URLSearchParams({
        client_id: keycloakConfig.clientId,
        post_logout_redirect_uri: window.location.origin,
      });

      window.location.href = `${logoutUrl}?${params.toString()}`;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      // Return the access token
      return localStorage.getItem('keycloak_token');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getUserInfo(): Promise<KeycloakUser | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        return null;
      }

      // Mock user info - replace with actual Keycloak user info endpoint
      return {
        id: '1',
        username: 'john.doe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['student'],
        schoolId: 'school_1'
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      // Refresh the access token using refresh token
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('keycloak_token');
    return !!token;
  }

  hasRole(role: string): boolean {
    // Check if user has a specific role
    const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    return userRoles.includes(role);
  }
}

export const keycloakService = KeycloakService.getInstance();
