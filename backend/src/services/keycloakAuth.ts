
import axios from 'axios';

export const loginUser = async (username: string, password: string) => {
  try {
    const tokenRes = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'myschoolbuddies-backend-client',
        client_secret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET!,
        username,
        password,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return tokenRes.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error('Invalid credentials');
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const tokenRes = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'myschoolbuddies-backend-client',
        client_secret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return tokenRes.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Token refresh failed');
  }
};

export const revokeToken = async (refreshToken: string) => {
  try {
    await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
      new URLSearchParams({
        client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'myschoolbuddies-backend-client',
        client_secret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
  } catch (error) {
    console.error('Token revocation failed:', error);
    // Don't throw error for logout - best effort
  }
};
