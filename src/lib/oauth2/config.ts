
import type { OAuth2Config } from './types';

export class OAuth2ConfigService {
  private config: OAuth2Config | null = null;
  private readonly fallbackConfig: Partial<OAuth2Config>;

  constructor() {
    // Fallback configuration from environment variables
    this.fallbackConfig = {
      keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      redirectUri: this.getRedirectUri()
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('[OAuth2Config] Fetching configuration from API...');
      
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.99:3033/api';
      console.log('[OAuth2Config] Using backend URL:', backendUrl);
      const response = await fetch(`${backendUrl}/oauth2/config`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OAuth2 config: ${response.status}`);
      }
      
      const apiConfig = await response.json();
      
      this.config = {
        keycloakUrl: apiConfig.keycloakUrl,
        realm: apiConfig.realm,
        clientId: apiConfig.clientId,
        redirectUri: this.getRedirectUri()
      };
      
      console.log('[OAuth2Config] Configuration loaded from API:', {
        keycloakUrl: this.config.keycloakUrl,
        realm: this.config.realm,
        clientId: this.config.clientId,
        redirectUri: this.config.redirectUri
      });
      
      this.validateConfiguration();
    } catch (error) {
      console.warn('[OAuth2Config] Failed to load from API, using fallback config:', error);
      
      // Use fallback configuration
      this.config = {
        keycloakUrl: this.fallbackConfig.keycloakUrl || '',
        realm: this.fallbackConfig.realm || '',
        clientId: this.fallbackConfig.clientId || '',
        redirectUri: this.fallbackConfig.redirectUri || ''
      };
      
      this.validateConfiguration();
    }
  }

  private getRedirectUri(): string {
    const envRedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
    
    if (!envRedirectUri) {
      console.error('[OAuth2] Missing VITE_OAUTH2_REDIRECT_URI environment variable');
      throw new Error('VITE_OAUTH2_REDIRECT_URI environment variable is required');
    }
    
    console.log('[OAuth2] Using redirect URI:', envRedirectUri);
    return envRedirectUri;
  }

  private validateConfiguration(): void {
    const requiredVars = {
      VITE_KEYCLOAK_URL: this.config.keycloakUrl,
      VITE_KEYCLOAK_REALM: this.config.realm,
      VITE_KEYCLOAK_CLIENT_ID: this.config.clientId,
      VITE_OAUTH2_REDIRECT_URI: this.config.redirectUri
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(', ')}`;
      console.error(`[OAuth2] Configuration validation failed`, { missing, current: requiredVars });
      throw new Error(error);
    }

    if (import.meta.env.DEV) {
      console.log('[OAuth2] Configuration validated successfully (public client)', {
        keycloakUrl: this.config.keycloakUrl,
        realm: this.config.realm,
        clientId: this.config.clientId,
        redirectUri: this.config.redirectUri,
        clientType: 'public'
      });
    }
  }

  getConfig(): OAuth2Config {
    if (!this.config) {
      throw new Error('OAuth2 configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  getKeycloakUrl(): string {
    if (!this.config) {
      throw new Error('OAuth2 configuration not initialized. Call initialize() first.');
    }
    return this.config.keycloakUrl;
  }

  getRealm(): string {
    if (!this.config) {
      throw new Error('OAuth2 configuration not initialized. Call initialize() first.');
    }
    return this.config.realm;
  }

  getClientId(): string {
    if (!this.config) {
      throw new Error('OAuth2 configuration not initialized. Call initialize() first.');
    }
    return this.config.clientId;
  }

  getRedirectUriValue(): string {
    if (!this.config) {
      throw new Error('OAuth2 configuration not initialized. Call initialize() first.');
    }
    return this.config.redirectUri;
  }
}
