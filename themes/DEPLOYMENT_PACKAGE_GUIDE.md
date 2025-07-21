
# Keycloak Theme Deployment Guide - Production Ready

## Quick Start
1. Copy the `myschoolbuddies` folder to your Keycloak themes directory
2. Restart Keycloak server
3. Apply theme to your realm
4. Test all authentication flows

## Detailed Deployment Steps

### Step 1: Prepare Keycloak Server
```bash
# For Docker deployment
docker exec -it keycloak-container bash

# For standalone deployment
cd /opt/keycloak/themes/
```

### Step 2: Deploy Theme Files
```bash
# Copy theme folder to Keycloak themes directory
cp -r myschoolbuddies /opt/keycloak/themes/

# Set proper permissions
chown -R keycloak:keycloak /opt/keycloak/themes/myschoolbuddies
chmod -R 755 /opt/keycloak/themes/myschoolbuddies
```

### Step 3: Restart Keycloak
```bash
# For Docker
docker restart keycloak-container

# For standalone
systemctl restart keycloak
```

### Step 4: Apply Theme to Realm
1. Login to Keycloak Admin Console
2. Navigate to: Realm Settings → Themes
3. Set Login Theme: `myschoolbuddies`
4. Set Account Theme: `myschoolbuddies` (optional)
5. Click "Save"

### Step 5: Test Authentication Flows
Test these pages:
- Login: `/auth/realms/myschoolbuddies/protocol/openid-connect/auth`
- Registration: `/auth/realms/myschoolbuddies/login-actions/registration`
- Password Reset: Test forgot password flow
- Profile Update: Test email/password update

## Production Checklist
- [ ] Theme files copied to correct directory
- [ ] Keycloak server restarted
- [ ] Theme applied to realm
- [ ] Login page loads correctly
- [ ] Registration page works
- [ ] Password reset functional
- [ ] Mobile responsive design verified
- [ ] All browsers tested
- [ ] SSL certificate configured
- [ ] Domain configured correctly

## Troubleshooting
**Theme not appearing**: Check file permissions and restart Keycloak
**CSS not loading**: Verify theme.properties has correct resource paths
**Mobile issues**: Test on actual devices, not just browser dev tools
**Logo not showing**: Check logo.png file exists and has proper permissions

## Production Domain Configuration
For deployment to https://login.hostingmanager.in:
1. Update realm settings with correct domain
2. Configure SSL certificates
3. Set proper CORS origins
4. Update client redirect URIs
5. Test OAuth2 callback URLs

## Support
For issues with theme deployment, check:
1. Keycloak logs: `/opt/keycloak/logs/`
2. Theme file permissions
3. Keycloak version compatibility
4. Browser console for CSS/JS errors
