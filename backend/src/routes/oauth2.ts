import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/oauth2/token - Exchange authorization code for tokens
router.post('/token', async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({ 
        error: 'Missing required parameters: code, codeVerifier, redirectUri' 
      });
    }

    // Exchange code for tokens with Keycloak
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KEYCLOAK_FRONTEND_CLIENT_ID!,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    // Add client secret if configured (for confidential clients)
    if (process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET) {
      tokenParams.append('client_secret', process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET);
    }

    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      tokenParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = tokenResponse.data;
    
    // Log successful token exchange
    logger.info('OAuth2 token exchange successful', {
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
    });

    res.json(tokens);
  } catch (error) {
    logger.error('OAuth2 token exchange failed:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error_description || 'Token exchange failed';
      return res.status(status).json({ error: message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/oauth2/userinfo - Get user information from access token
router.get('/userinfo', async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.substring(7);
    
    // Get user info from Keycloak
    const userInfoResponse = await axios.get(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const keycloakUser = userInfoResponse.data;
    
    // Decode JWT to get roles
    const decodedToken = jwt.decode(accessToken) as any;
    const roles = decodedToken?.realm_access?.roles || [];
    
    // Determine primary role based on hierarchy
    let primaryRole = 'student'; // default
    if (roles.includes('platform_admin')) {
      primaryRole = 'platform_admin';
    } else if (roles.includes('school_admin')) {
      primaryRole = 'school_admin';
    } else if (roles.includes('teacher')) {
      primaryRole = 'teacher';
    } else if (roles.includes('alumni')) {
      primaryRole = 'alumni';
    }

    // Format user info response
    const userInfo = {
      id: keycloakUser.sub,
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      role: primaryRole,
      roles: roles,
      schoolId: decodedToken?.school_id || keycloakUser.school_id,
      profilePictureUrl: keycloakUser.picture,
      emailVerified: keycloakUser.email_verified,
    };

    logger.info('User info retrieved successfully', {
      userId: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      roles: userInfo.roles,
    });

    res.json(userInfo);
  } catch (error) {
    logger.error('Failed to get user info:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'Failed to get user info';
      return res.status(status).json({ error: message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/oauth2/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const refreshParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KEYCLOAK_FRONTEND_CLIENT_ID!,
      refresh_token: refreshToken,
    });

    // Add client secret if configured
    if (process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET) {
      refreshParams.append('client_secret', process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET);
    }

    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      refreshParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = tokenResponse.data;
    
    logger.info('Token refresh successful');
    
    res.json(tokens);
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error_description || 'Token refresh failed';
      return res.status(status).json({ error: message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/oauth2/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke refresh token with Keycloak
      const logoutParams = new URLSearchParams({
        client_id: process.env.KEYCLOAK_FRONTEND_CLIENT_ID!,
        refresh_token: refreshToken,
      });

      // Add client secret if configured
      if (process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET) {
        logoutParams.append('client_secret', process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET);
      }

      try {
        await axios.post(
          `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
          logoutParams.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        
        logger.info('User logged out successfully');
      } catch (error) {
        logger.warn('Keycloak logout failed, but continuing with local logout:', error);
      }
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/oauth2/authorize - Helper endpoint to build authorization URL
router.get('/authorize', (req, res) => {
  try {
    const {
      client_id = process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      redirect_uri = process.env.OAUTH2_REDIRECT_URI,
      response_type = 'code',
      scope = 'openid profile email',
      state,
      code_challenge,
      code_challenge_method = 'S256',
    } = req.query;

    if (!state || !code_challenge) {
      return res.status(400).json({ 
        error: 'Missing required parameters: state, code_challenge' 
      });
    }

    const authUrl = new URL(`${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`);
    
    authUrl.searchParams.append('client_id', client_id as string);
    authUrl.searchParams.append('redirect_uri', redirect_uri as string);
    authUrl.searchParams.append('response_type', response_type as string);
    authUrl.searchParams.append('scope', scope as string);
    authUrl.searchParams.append('state', state as string);
    authUrl.searchParams.append('code_challenge', code_challenge as string);
    authUrl.searchParams.append('code_challenge_method', code_challenge_method as string);

    res.json({ 
      authUrl: authUrl.toString(),
      parameters: {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state,
        code_challenge,
        code_challenge_method,
      }
    });
  } catch (error) {
    logger.error('Failed to build authorization URL:', error);
    res.status(500).json({ error: 'Failed to build authorization URL' });
  }
});

export default router;