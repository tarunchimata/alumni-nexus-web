import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from './logger';

// Keycloak JWKS client cache
let jwksClientInstance: jwksClient.JwksClient | null = null;

function getJwksClient(): jwksClient.JwksClient {
  if (!jwksClientInstance) {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;

    if (!keycloakUrl || !realm) {
      throw new Error('KEYCLOAK_URL and KEYCLOAK_REALM environment variables are required');
    }

    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    jwksClientInstance = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 3600000, // 1 hour
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  return jwksClientInstance;
}

export async function verifyKeycloakToken(token: string): Promise<any> {
  try {
    // Get the key ID from the token header
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string') {
      throw new Error('Invalid token format');
    }

    const kid = decodedHeader.header.kid;
    if (!kid) {
      throw new Error('Token missing key ID (kid)');
    }

    // Get the signing key from Keycloak JWKS
    const client = getJwksClient();
    const key = await client.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    // Verify the token
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'], // Keycloak uses RS256
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      audience: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
    });

    return verified;
  } catch (error) {
    logger.error('Keycloak token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}