
import type { OAuth2Config } from './types';

export class OAuth2ConfigService {
  private readonly config: OAuth2Config;

  constructor() {
    this.config = {
      keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      clientSecret: this.getClientSecret(),
      redirectUri: this.getRedirectUri()
    };

    this.validateConfiguration();
  }

  private getClientSecret(): string {
    const envClientSecret = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET;
    const fallbackClientSecret = 'F6NBOY2YrW3ZtD2zsgWwatASL3sAFP7Q';
    
    return envClientSecret || fallbackClientSecret;
  }

  private getRedirectUri(): string {
    const envRedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
    const defaultRedirectUri = 'https://preview--alumni-nexus-web.lovable.app/oauth2/callback';
    
    return envRedirectUri || defaultRedirectUri;
  }

  private validateConfiguration(): void {
    const requiredVars = {
      VITE_KEYCLOAK_URL: this.config.keycloakUrl,
      VITE_KEYCLOAK_REALM: this.config.realm,
      VITE_KEYCLOAK_CLIENT_ID: this.config.clientId
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(', ')}`;
      console.error(`[OAuth2] Configuration validation failed`, { missing, current: requiredVars });
      throw new Error(error);
    }

    if (!this.config.clientSecret) {
      const error = 'Client secret is required for OAuth2 authentication';
      console.error(`[OAuth2] Client secret validation failed`);
      throw new Error(error);
    }

    if (import.meta.env.DEV) {
      console.log('[OAuth2] Configuration validated successfully', {
        keycloakUrl: this.config.keycloakUrl,
        realm: this.config.realm,
        clientId: this.config.clientId,
        hasClientSecret: !!this.config.clientSecret,
        redirectUri: this.config.redirectUri,
        clientSecretSource: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET ? 'environment' : 'fallback'
      });
    }
  }

  getConfig(): OAuth2Config {
    return this.config;
  }

  getKeycloakUrl(): string {
    return this.config.keycloakUrl;
  }

  getRealm(): string {
    return this.config.realm;
  }

  getClientId(): string {
    return this.config.clientId;
  }

  public getClientSecretValue(): string {
    return this.config.clientSecret;
  }

  getRedirectUriValue(): string {
    return this.config.redirectUri;
  }
}
