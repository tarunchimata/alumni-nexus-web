
import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
const keycloak = new Keycloak({
  url: 'https://login.hostingmanager.in',
  realm: 'myschoolbuddies-realm',
  clientId: 'myschoolbuddies-client',
});

// Keycloak configuration
const keycloakConfig = {
  onLoad: 'check-sso' as const,
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256' as const,
  enableLogging: process.env.NODE_ENV === 'development',
};

// Initialize Keycloak
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    keycloak
      .init(keycloakConfig)
      .then((authenticated) => {
        console.log('Keycloak initialized. Authenticated:', authenticated);
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        reject(error);
      });
  });
};

// Login function
export const login = () => {
  keycloak.login({
    redirectUri: window.location.origin + '/dashboard',
  });
};

// Logout function
export const logout = () => {
  keycloak.logout({
    redirectUri: window.location.origin,
  });
};

// Register function
export const register = () => {
  keycloak.register({
    redirectUri: window.location.origin + '/dashboard',
  });
};

// Get token
export const getToken = (): string | undefined => {
  return keycloak.token;
};

// Get user info
export const getUserInfo = () => {
  if (!keycloak.tokenParsed) return null;
  
  return {
    id: keycloak.tokenParsed.sub,
    email: keycloak.tokenParsed.email,
    firstName: keycloak.tokenParsed.given_name,
    lastName: keycloak.tokenParsed.family_name,
    roles: keycloak.tokenParsed.realm_access?.roles || [],
  };
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false;
};

// Check if user has role
export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role);
};

// Update token
export const updateToken = (minValidity = 30): Promise<boolean> => {
  return keycloak.updateToken(minValidity);
};

export default keycloak;
