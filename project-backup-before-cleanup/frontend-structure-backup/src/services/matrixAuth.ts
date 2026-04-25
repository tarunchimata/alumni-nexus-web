import { authService } from '@/lib/auth';

export class MatrixAuthService {
  private static readonly MATRIX_DOMAIN = 'chat.hostingmanager.in';
  
  /**
   * Get Matrix user ID from Keycloak user info
   */
  static async getMatrixUserId(): Promise<string | null> {
    try {
      const userInfo = await authService.getUserInfo();
      if (!userInfo || !userInfo.email) {
        return null;
      }
      
      const localpart = userInfo.email.split('@')[0];
      return `@${localpart}:${this.MATRIX_DOMAIN}`;
    } catch (error) {
      console.error('[MatrixAuth] Failed to get Matrix user ID:', error);
      return null;
    }
  }

  /**
   * Get Matrix login token using SSO
   */
  static async getMatrixLoginToken(): Promise<string | null> {
    try {
      const keycloakToken = localStorage.getItem('auth_access_token');
      if (!keycloakToken) {
        return null;
      }

      // In a production environment, this would exchange the Keycloak token
      // for a Matrix access token via the Matrix server's SSO endpoint
      // For now, we'll use a simplified approach
      
      const response = await fetch(`https://${this.MATRIX_DOMAIN}/_matrix/client/v3/login/sso/redirect/oidc-keycloak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keycloakToken}`,
        },
        redirect: 'manual',
      });

      // This is a simplified implementation
      // In production, the Matrix server would handle the SSO flow
      return keycloakToken; // Temporary fallback
    } catch (error) {
      console.error('[MatrixAuth] Failed to get Matrix login token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated with Matrix
   */
  static async isMatrixAuthenticated(): Promise<boolean> {
    const matrixUserId = await this.getMatrixUserId();
    const token = await this.getMatrixLoginToken();
    
    return !!(matrixUserId && token);
  }
}

export const matrixAuthService = new MatrixAuthService();