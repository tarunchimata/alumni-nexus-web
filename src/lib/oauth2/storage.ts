
import type { TokenResponse } from './types';

export class OAuth2StorageService {
  // Store tokens securely in localStorage
  storeTokens(tokens: TokenResponse): void {
    try {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('oauth2_access_token', tokens.access_token);
      localStorage.setItem('oauth2_refresh_token', tokens.refresh_token);
      localStorage.setItem('oauth2_expires_at', expiresAt.toString());
      
      console.log('[OAuth2] ✅ Tokens stored successfully', {
        accessTokenLength: tokens.access_token.length,
        refreshTokenLength: tokens.refresh_token.length,
        expiresAt: new Date(expiresAt).toISOString()
      });
    } catch (error) {
      console.log('[OAuth2] ❌ Error storing tokens', error);
      throw new Error('Could not store authentication tokens. Please check browser storage permissions.');
    }
  }

  // Get stored access token
  getAccessToken(): string | null {
    try {
      return localStorage.getItem('oauth2_access_token');
    } catch (error) {
      console.log('[OAuth2] Warning: Could not retrieve access token', error);
      return null;
    }
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem('oauth2_refresh_token');
    } catch (error) {
      console.log('[OAuth2] Warning: Could not retrieve refresh token', error);
      return null;
    }
  }

  // Get token expiration time
  getTokenExpiresAt(): number | null {
    try {
      const expiresAt = localStorage.getItem('oauth2_expires_at');
      return expiresAt ? parseInt(expiresAt) : null;
    } catch (error) {
      console.log('[OAuth2] Warning: Could not retrieve token expiry', error);
      return null;
    }
  }

  // Check if token is expired (with 5 minute buffer)
  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return true;
    
    return Date.now() > (expiresAt - 300000);
  }

  // Store OAuth2 state parameters
  storeOAuth2State(codeVerifier: string, state: string): void {
    try {
      const timestamp = Date.now().toString();
      localStorage.setItem('oauth2_code_verifier', codeVerifier);
      localStorage.setItem('oauth2_state', state);
      localStorage.setItem('oauth2_login_timestamp', timestamp);
      
      console.log('[OAuth2] Stored OAuth2 parameters in localStorage successfully', {
        codeVerifierStored: !!localStorage.getItem('oauth2_code_verifier'),
        stateStored: !!localStorage.getItem('oauth2_state'),
        timestampStored: !!localStorage.getItem('oauth2_login_timestamp')
      });
    } catch (error) {
      console.log('[OAuth2] ERROR: Failed to store OAuth2 parameters', error);
      throw new Error('Could not store OAuth2 parameters. Please check browser storage permissions.');
    }
  }

  // Get stored OAuth2 state parameters
  getOAuth2State(): { codeVerifier: string | null; state: string | null; timestamp: string | null } {
    return {
      codeVerifier: localStorage.getItem('oauth2_code_verifier'),
      state: localStorage.getItem('oauth2_state'),
      timestamp: localStorage.getItem('oauth2_login_timestamp')
    };
  }

  // Clear OAuth2 state and parameters
  clearOAuth2State(): void {
    console.log('[OAuth2] Clearing OAuth2 state parameters');
    try {
      localStorage.removeItem('oauth2_code_verifier');
      localStorage.removeItem('oauth2_state');
      localStorage.removeItem('oauth2_login_timestamp');
    } catch (error) {
      console.log('[OAuth2] Warning: Could not clear localStorage', error);
    }
  }

  // Clear all stored tokens
  clearTokens(): void {
    try {
      localStorage.removeItem('oauth2_access_token');
      localStorage.removeItem('oauth2_refresh_token');
      localStorage.removeItem('oauth2_expires_at');
      localStorage.removeItem('oauth2_code_verifier');
      localStorage.removeItem('oauth2_state');
    } catch (error) {
      console.log('[OAuth2] Warning: Could not clear tokens from localStorage', error);
    }
  }
}
