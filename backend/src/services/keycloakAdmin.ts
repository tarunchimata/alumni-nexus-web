
import axios from 'axios';
import { logger } from '../utils/logger';

let KcAdminClient: any = null;

async function getKeycloakAdminClient() {
  if (!KcAdminClient) {
    try {
      const keycloakModule = await import('@keycloak/keycloak-admin-client');
      KcAdminClient = keycloakModule.default || keycloakModule;
    } catch (error) {
      logger.error('Failed to import Keycloak admin client:', error);
      throw new Error('Keycloak admin client not available');
    }
  }
  return KcAdminClient;
}

export class KeycloakAdminService {
  private kcAdmin: any = null;
  private tokenExpiry: number = 0;

  async getAdmin() {
    if (!this.kcAdmin) {
      const KcAdminClientClass = await getKeycloakAdminClient();
      this.kcAdmin = new KcAdminClientClass({
        baseUrl: process.env.KEYCLOAK_URL!,
        realmName: process.env.KEYCLOAK_REALM!,
      });
    }
    return this.kcAdmin;
  }

  async authenticate() {
    const now = Date.now();
    if (this.tokenExpiry > now + 30000) { // Token valid for at least 30 more seconds
      return;
    }

    const kcAdmin = await this.getAdmin();
    try {
      await kcAdmin.auth({
        grantType: 'password',
        clientId: 'admin-cli',
        username: process.env.KEYCLOAK_ADMIN_USERNAME!,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD!,
      });
      this.tokenExpiry = now + (55 * 60 * 1000); // Assume 55 min validity
      logger.info('Keycloak admin authentication successful');
    } catch (error) {
      logger.error('Keycloak admin authentication failed:', error);
      throw new Error('Failed to authenticate with Keycloak admin');
    }
  }

  private async retry<T>(fn: () => Promise<T>, label: string, maxAttempts = 4): Promise<T> {
    let attempt = 0;
    let lastError: any;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status || error?.status || 0;
        if (status === 429 || status >= 500) {
          const delay = Math.min(2000, 250 * Math.pow(2, attempt));
          logger.warn(`[KC RETRY] ${label} attempt ${attempt + 1} failed (status ${status}). Retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          attempt++;
          continue;
        }
        break;
      }
    }
    logger.error(`[KC ERROR] ${label} failed after ${maxAttempts} attempts`, lastError);
    throw lastError || new Error(`${label} failed`);
  }

  async createUser({
    username,
    email,
    password,
    firstName,
    lastName,
    school_id,
    user_type,
    phone,
    dateOfBirth,
    status = 'pending_approval'
  }: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    school_id: string;
    user_type: string;
    phone?: string;
    dateOfBirth?: string;
    status?: string;
  }) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();

    try {
      // Create user in Keycloak
      const userPayload = {
        username,
        email,
        firstName,
        lastName,
        enabled: status === 'active',
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
        attributes: {
          school_id: [school_id],
          user_type: [user_type],
          status: [status],
          ...(phone && { phone: [phone] }),
          ...(dateOfBirth && { date_of_birth: [dateOfBirth] }),
        },
      };

      const user = await kcAdmin.users.create(userPayload);
      logger.info(`User created in Keycloak: ${username} (${email})`);

      // Assign role based on user_type
      if (user.id) {
        await this.assignUserRole(user.id, user_type);
      }

      return user.id;
    } catch (error) {
      logger.error('Failed to create user in Keycloak:', error);
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assignUserRole(userId: string, roleName: string) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();

    return this.retry(async () => {
      const roles = await kcAdmin.roles.find({ realm: process.env.KEYCLOAK_REALM });
      const userRole = roles.find((role: any) => role.name === roleName);
      if (userRole && userRole.id) {
        await kcAdmin.users.addRealmRoleMappings({
          id: userId,
          roles: [{ id: userRole.id, name: userRole.name }],
        });
        logger.info(`Role ${roleName} assigned to user ${userId}`);
      } else {
        logger.warn(`Role ${roleName} not found in Keycloak realm`);
      }
    }, 'assignUserRole');
  }

  async getUserByEmail(email: string) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();

    try {
      const users = await kcAdmin.users.find({ email, exact: true });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Failed to get user by email:', error);
      return null;
    }
  }

  async getUserByUsername(username: string) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();

    try {
      const users = await kcAdmin.users.find({ username, exact: true });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Failed to get user by username:', error);
      return null;
    }
  }

  async updateUserStatus(userId: string, status: 'active' | 'pending_approval' | 'inactive' | 'rejected') {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();

    try {
      await kcAdmin.users.update(
        { id: userId },
        {
          enabled: status === 'active',
          attributes: { status: [status] }
        }
      );
      logger.info(`User ${userId} status updated to ${status}`);
    } catch (error) {
      logger.error('Failed to update user status:', error);
      throw new Error('User status update failed');
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  async updateUserAttributes(userId: string, attributes: Record<string, any>) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();
    return this.retry(async () => {
      await kcAdmin.users.update({ id: userId }, { attributes });
      logger.info(`Updated attributes for user ${userId}`);
    }, 'updateUserAttributes');
  }

  async setUserEnabled(userId: string, enabled: boolean) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();
    return this.retry(async () => {
      await kcAdmin.users.update({ id: userId }, { enabled });
      logger.info(`Set enabled=${enabled} for user ${userId}`);
    }, 'setUserEnabled');
  }

  async deleteUser(userId: string) {
    await this.authenticate();
    const kcAdmin = await this.getAdmin();
    return this.retry(async () => {
      await kcAdmin.users.del({ id: userId });
      logger.info(`Deleted Keycloak user ${userId}`);
    }, 'deleteUser');
  }
}

export const keycloakAdminClient = new KeycloakAdminService();
