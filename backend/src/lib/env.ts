import { z } from 'zod';

// Environment validation schema
export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Server
  PORT: z.string().transform(Number).optional().default(() => '3033'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  // Keycloak OAuth2
  USE_OAUTH2: z.string().transform(val => val === 'true').optional().default(() => 'false'),
  KEYCLOAK_URL: z.string().url('KEYCLOAK_URL must be a valid URL'),
  KEYCLOAK_REALM: z.string().min(1, 'KEYCLOAK_REALM is required'),
  KEYCLOAK_FRONTEND_CLIENT_ID: z.string().min(1, 'KEYCLOAK_FRONTEND_CLIENT_ID is required'),

  // Keycloak Admin (optional for some operations)
  KEYCLOAK_ADMIN_USERNAME: z.string().optional(),
  KEYCLOAK_ADMIN_PASSWORD: z.string().optional(),

  // Session
  SESSION_SECRET: z.string().min(10, 'SESSION_SECRET must be at least 10 characters'),

  // CORS
  CORS_ORIGIN: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).optional().default(() => '900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).optional().default(() => '100'),

  // Cookie Security
  COOKIE_SECURE: z.string().transform(val => val === 'true').optional().default(() => 'false'),

  // Email (optional)
  SENDGRID_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
});

// Parse and validate environment variables
export function validateEnvironment() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment type
export type ValidatedEnv = z.infer<typeof envSchema>;