
import { logger } from '../utils/logger';
import { keycloakAdminClient } from './keycloakAdmin';
import { ROLE_HIERARCHY } from '../types/auth';

export class RoleService {
  // Get user roles from Keycloak
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      await keycloakAdminClient.authenticate();
      const userRoles = await keycloakAdminClient.kcAdmin.users.listRealmRoleMappings({
        id: userId,
      });
      
      return userRoles.map(role => role.name!).filter(Boolean);
    } catch (error) {
      logger.error('Failed to fetch user roles:', error);
      return [];
    }
  }

  // Assign role to user
  static async assignRole(userId: string, roleName: string): Promise<boolean> {
    try {
      await keycloakAdminClient.authenticate();
      
      const roles = await keycloakAdminClient.kcAdmin.roles.find({ 
        realm: process.env.KEYCLOAK_REALM 
      });
      
      const role = roles.find(r => r.name === roleName);
      if (!role || !role.id) {
        throw new Error(`Role ${roleName} not found`);
      }

      await keycloakAdminClient.kcAdmin.users.addRealmRoleMappings({
        id: userId,
        roles: [{ id: role.id, name: role.name }],
      });

      logger.info(`Assigned role ${roleName} to user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to assign role ${roleName} to user ${userId}:`, error);
      return false;
    }
  }

  // Remove role from user
  static async removeRole(userId: string, roleName: string): Promise<boolean> {
    try {
      await keycloakAdminClient.authenticate();
      
      const roles = await keycloakAdminClient.kcAdmin.roles.find({ 
        realm: process.env.KEYCLOAK_REALM 
      });
      
      const role = roles.find(r => r.name === roleName);
      if (!role || !role.id) {
        throw new Error(`Role ${roleName} not found`);
      }

      await keycloakAdminClient.kcAdmin.users.delRealmRoleMappings({
        id: userId,
        roles: [{ id: role.id, name: role.name }],
      });

      logger.info(`Removed role ${roleName} from user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to remove role ${roleName} from user ${userId}:`, error);
      return false;
    }
  }

  // Get all available roles
  static getAvailableRoles(): string[] {
    return Object.keys(ROLE_HIERARCHY);
  }

  // Validate role name
  static isValidRole(roleName: string): boolean {
    return roleName in ROLE_HIERARCHY;
  }

  // Get role hierarchy
  static getRoleHierarchy(roleName: string): number {
    return ROLE_HIERARCHY[roleName]?.hierarchy || 0;
  }

  // Get role permissions
  static getRolePermissions(roleName: string): string[] {
    return ROLE_HIERARCHY[roleName]?.permissions || [];
  }
}
