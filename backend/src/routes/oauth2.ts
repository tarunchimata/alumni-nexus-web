import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/oauth2/token - Exchange authorization code for tokens
router.post('/token', async (req, res) => {
  // Ensure all responses are JSON
  res.setHeader('Content-Type', 'application/json');
  
  logger.info('=== OAUTH2 TOKEN EXCHANGE START ===');
  logger.info('Request headers:', req.headers);
  logger.info('Request body keys:', Object.keys(req.body || {}));
  
  try {
    logger.info('OAuth2 token exchange request received', { 
      hasCode: !!req.body.code,
      hasCodeVerifier: !!req.body.code_verifier,
      hasRedirectUri: !!req.body.redirectUri 
    });

    const { code, code_verifier, redirectUri } = req.body;

    if (!code || !code_verifier || !redirectUri) {
      logger.warn('OAuth2 token exchange: Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing required parameters: code, code_verifier, redirectUri' 
      });
    }

    // Exchange code for tokens with Keycloak
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KEYCLOAK_FRONTEND_CLIENT_ID!,
      code,
      redirect_uri: redirectUri,
      code_verifier: code_verifier,
    });

    // Add client secret if configured (for confidential clients)
    if (process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET) {
      tokenParams.append('client_secret', process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET);
    }

    logger.info('Making token exchange request to Keycloak', {
      url: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      hasClientSecret: !!process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET
    });

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

    logger.info('Token exchange successful', {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token
    });

    logger.info('=== SENDING SUCCESSFUL RESPONSE ===');
    logger.info('Response headers:', res.getHeaders());
    logger.info('Response status:', 200);
    logger.info('Response data keys:', Object.keys(tokens));
    res.json(tokens);
    logger.info('=== OAUTH2 TOKEN EXCHANGE SUCCESS ===');
  } catch (error) {
    logger.error('=== OAUTH2 TOKEN EXCHANGE ERROR ===');
    logger.error('OAuth2 token exchange failed:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error_description || 'Token exchange failed';
      logger.error('Keycloak token exchange error details:', {
        status,
        message,
        keycloakResponse: error.response?.data
      });
      return res.status(status).json({ error: message });
    }
    
    logger.error('Non-axios error during token exchange:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({ error: 'Internal server error' });
    logger.error('=== OAUTH2 TOKEN EXCHANGE FAILED ===');
  }
});

// GET /api/oauth2/userinfo - Get user information from access token
router.get('/userinfo', async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('OAuth2 userinfo request received');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('OAuth2 userinfo: Missing or invalid authorization header');
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.substring(7);
    logger.info('OAuth2 userinfo: Token extracted, making request to Keycloak');
    
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

    logger.info('OAuth2 userinfo: User info formatted successfully', {
      userId: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      rolesCount: userInfo.roles.length
    });

    res.setHeader('Content-Type', 'application/json');
    res.json(userInfo);
  } catch (error) {
    logger.error('Failed to get user info:', error);
    
    res.setHeader('Content-Type', 'application/json');
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'Failed to get user info';
      logger.error('Keycloak userinfo error details:', {
        status,
        message,
        keycloakResponse: error.response?.data
      });
      return res.status(status).json({ error: message });
    }
    
    logger.error('Non-axios error during userinfo fetch:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/oauth2/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    logger.info('OAuth2 refresh token request received');
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('OAuth2 refresh: Missing refresh token');
      res.setHeader('Content-Type', 'application/json');
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
    
    logger.info('Token refresh successful', {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.json(tokens);
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    res.setHeader('Content-Type', 'application/json');
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error_description || 'Token refresh failed';
      logger.error('Keycloak refresh token error details:', {
        status,
        message,
        keycloakResponse: error.response?.data
      });
      return res.status(status).json({ error: message });
    }
    
    logger.error('Non-axios error during token refresh:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/oauth2/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    logger.info('OAuth2 logout request received');
    
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

    res.setHeader('Content-Type', 'application/json');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.setHeader('Content-Type', 'application/json');
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