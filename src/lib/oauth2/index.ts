
export { OAuth2Service } from './service';
export { OAuth2ConfigService } from './config';
export { PKCEService } from './pkce';
export { OAuth2StorageService } from './storage';
export type { TokenResponse, UserInfo, KeycloakErrorResponse, OAuth2Config } from './types';

// Export the singleton instance for backward compatibility
import { OAuth2Service } from './service';
export const oauth2Service = new OAuth2Service();
export default oauth2Service;
