
import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { verifyKeycloakToken } from '../utils/keycloak-jwt';
import { AuthenticatedRequest } from '../middleware/auth';

const router: express.Router = express.Router();

// POST /api/oauth2/token - Exchange authorization code for tokens
router.post('/token', async (req, res) => {
  logger.info('=== OAUTH2 TOKEN EXCHANGE REQUEST START ===');
  
  try {
    const { code, code_verifier, redirectUri } = req.body;
    
    logger.info('Request parameters:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      hasCodeVerifier: !!code_verifier,
      verifierLength: code_verifier?.length || 0,
      redirectUri: redirectUri,
      origin: req.headers.origin
    });

    if (!code || !code_verifier || !redirectUri) {
      logger.warn('OAuth2 token exchange: Missing required parameters');
      return res.status(400).json({ 
        error: 'missing_parameters',
        message: 'Missing required parameters: code, code_verifier, redirectUri',
        details: {
          hasCode: !!code,
          hasCodeVerifier: !!code_verifier,
          hasRedirectUri: !!redirectUri
        }
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

    const keycloakTokenUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    
    logger.info('Making token exchange request to Keycloak:', {
      url: keycloakTokenUrl,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID
    });

    const tokenResponse = await axios.post(
      keycloakTokenUrl,
      tokenParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000, // 15 second timeout
      }
    );

    const tokens = tokenResponse.data;
    
    logger.info('OAuth2 token exchange successful', {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token
    });

    // Ensure proper JSON response
    const response = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope
    };

    res.status(200).json(response);
    logger.info('=== OAUTH2 TOKEN EXCHANGE SUCCESS ===');
  } catch (error) {
    logger.error('=== OAUTH2 TOKEN EXCHANGE ERROR ===');
    logger.error('OAuth2 token exchange failed:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const keycloakError = error.response?.data;
      
      logger.error('Keycloak token exchange error details:', {
        status,
        keycloakError,
        message: error.message
      });
      
      return res.status(status).json({ 
        error: 'keycloak_error',
        message: keycloakError?.error_description || keycloakError?.error || 'Token exchange with Keycloak failed',
        details: process.env.NODE_ENV === 'development' ? keycloakError : undefined,
        status
      });
    }
    
    logger.error('Non-axios error during token exchange:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({ 
      error: 'server_error',
      message: 'Internal server error during token exchange'
    });
  }
});

// GET /api/oauth2/userinfo - Get user information from access token
router.get('/userinfo', async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('OAuth2 userinfo request received');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('OAuth2 userinfo: Missing or invalid authorization header');
      return res.status(401).json({ 
        error: 'unauthorized',
        message: 'Missing or invalid authorization header' 
      });
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
        timeout: 10000,
      }
    );

    const keycloakUser = userInfoResponse.data;

    interface VerifiedTokenPayload {
      realm_access?: { roles?: string[] };
      school_id?: string;
    }

    let decodedToken: VerifiedTokenPayload;
    try {
      decodedToken = await verifyKeycloakToken(accessToken) as VerifiedTokenPayload;
    } catch (verificationError) {
      logger.warn('OAuth2 userinfo: invalid or expired token', verificationError);
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid or expired access token'
      });
    }

    const roles = Array.isArray(decodedToken.realm_access?.roles) ? decodedToken.realm_access.roles : [];
    
    // Determine primary role based on hierarchy
    let primaryRole = 'student';
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
      role: userInfo.role
    });

    res.status(200).json(userInfo);
  } catch (error) {
    logger.error('Failed to get user info:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'Failed to get user info';
      logger.error('Keycloak userinfo error details:', {
        status,
        message,
        keycloakResponse: error.response?.data
      });
      return res.status(status).json({ 
        error: 'keycloak_userinfo_error',
        message,
        status
      });
    }
    
    res.status(500).json({ 
      error: 'server_error',
      message: 'Internal server error while fetching user info'
    });
  }
});

// POST /api/oauth2/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    logger.info('OAuth2 refresh token request received');
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('OAuth2 refresh: Missing refresh token');
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
    
    res.json(tokens);
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
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

// GET /api/oauth2/config - Get OAuth2 configuration for frontend
router.get('/config', (req, res) => {
  try {
    logger.info('OAuth2 config request received');
    
    const config = {
      keycloakUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      authorizationEndpoint: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
      tokenEndpoint: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      userinfoEndpoint: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
      discoveryUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`
    };
    
    logger.info('OAuth2 config provided successfully', {
      keycloakUrl: config.keycloakUrl,
      realm: config.realm,
      clientId: config.clientId
    });
    
    res.json(config);
  } catch (error) {
    logger.error('Failed to get OAuth2 config:', error);
    res.status(500).json({ error: 'Failed to get OAuth2 configuration' });
  }
});

// GET /api/oauth2/health - OAuth2 debugging health check
router.get('/health', async (req, res) => {
  try {
    logger.info('=== OAUTH2 HEALTH CHECK START ===');
    
    const healthData: {
      status: string;
      timestamp: string;
      service: string;
      version: string;
      environment: string;
      configuration: {
        keycloakUrl: string;
        keycloakRealm: string;
        frontendClientId: string;
        backendClientId: string;
        hasClientSecret: boolean;
        corsOrigins: string;
        redirectUri: string;
      };
      endpoints: any;
      networkTest: any;
      keycloakConnectivity?: {
        status: string;
        responseTime?: string;
        issuer?: string;
        error?: string;
        details?: any;
      };
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'OAuth2 Service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      configuration: {
        keycloakUrl: process.env.KEYCLOAK_URL || 'NOT_CONFIGURED',
        keycloakRealm: process.env.KEYCLOAK_REALM || 'NOT_CONFIGURED',
        frontendClientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID || 'NOT_CONFIGURED',
        backendClientId: process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'NOT_CONFIGURED',
        hasClientSecret: !!process.env.KEYCLOAK_FRONTEND_CLIENT_SECRET,
        corsOrigins: process.env.CORS_ORIGIN || 'NOT_CONFIGURED',
        redirectUri: process.env.OAUTH2_REDIRECT_URI || 'NOT_CONFIGURED'
      },
      endpoints: {
        authorization: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
        token: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        userinfo: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        logout: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
        discovery: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`
      },
      networkTest: {
        origin: req.headers.origin || 'NO_ORIGIN',
        userAgent: req.headers['user-agent'] || 'NO_USER_AGENT',
        xForwardedFor: req.headers['x-forwarded-for'] || 'NO_X_FORWARDED_FOR',
        host: req.headers.host || 'NO_HOST',
        protocol: req.protocol || 'NO_PROTOCOL',
        secure: req.secure,
        ip: req.ip || 'NO_IP'
      }
    };

    // Test Keycloak connectivity
    try {
      logger.info('Testing Keycloak connectivity...');
      const discoveryUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`;
      
      const keycloakResponse = await axios.get(discoveryUrl, { timeout: 5000 });
      healthData.keycloakConnectivity = {
        status: 'connected',
        responseTime: 'ok',
        issuer: keycloakResponse.data?.issuer || 'unknown'
      };
      logger.info('Keycloak connectivity test successful');
    } catch (error) {
      logger.error('Keycloak connectivity test failed:', error);
      healthData.keycloakConnectivity = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'unknown error',
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined
      };
      healthData.status = 'degraded';
    }

    logger.info('=== OAUTH2 HEALTH CHECK COMPLETE ===');
    res.status(200).json(healthData);
  } catch (error) {
    logger.error('=== OAUTH2 HEALTH CHECK ERROR ===');
    logger.error('OAuth2 health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'OAuth2 Service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
