
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];
  schoolId?: string;
  avatar?: string;
}

export interface KeycloakErrorResponse {
  error: string;
  error_description?: string;
}

export interface OAuth2Config {
  keycloakUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
