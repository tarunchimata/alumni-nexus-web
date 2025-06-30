
import KcAdminClient from '@keycloak/keycloak-admin-client';
import axios from 'axios';

export const keycloakAdminClient = new (class {
  kcAdmin = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL!,
    realmName: process.env.KEYCLOAK_REALM!,
  });

  async authenticate() {
    await this.kcAdmin.auth({
      grantType: 'password',
      clientId: 'admin-cli',
      username: process.env.KEYCLOAK_ADMIN_USERNAME!,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD!,
    });
  }

  async createUser({
    username,
    email,
    password,
    school_id,
    user_type,
  }: {
    username: string;
    email: string;
    password: string;
    school_id: string;
    user_type: string;
  }) {
    await this.authenticate();

    const user = await this.kcAdmin.users.create({
      username,
      email,
      enabled: true,
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
      },
    });

    // Assign role based on user_type
    if (user.id) {
      const roles = await this.kcAdmin.roles.find({ realm: process.env.KEYCLOAK_REALM });
      const userRole = roles.find(role => role.name === user_type);
      
      if (userRole && userRole.id) {
        await this.kcAdmin.users.addRealmRoleMappings({
          id: user.id,
          roles: [{ id: userRole.id, name: userRole.name }],
        });
      }
    }

    return user.id;
  }

  async getUserProfile(accessToken: string) {
    try {
      // Use Keycloak userinfo endpoint
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
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }
})();
