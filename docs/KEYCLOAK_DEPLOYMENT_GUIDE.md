
# My School Buddies Keycloak Theme Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the My School Buddies custom Keycloak theme to your production environment.

## Prerequisites
- Keycloak server (version 22.0.0 or higher)
- Administrative access to Keycloak server
- SSH access to the server (for manual deployment)
- Basic understanding of Keycloak administration

## Theme Structure
```
myschoolbuddies/
├── theme.properties
└── login/
    ├── error.ftl
    ├── forgot-password.ftl
    ├── info.ftl
    ├── login.ftl
    ├── register.ftl
    ├── template.ftl
    ├── update-email.ftl
    ├── update-password.ftl
    └── resources/
        ├── css/
        │   ├── custom.css
        │   └── login.css
        ├── img/
        │   ├── favicon.ico
        │   └── logo.png
        └── js/
            └── password-strength.js
```

## Deployment Methods

### Method 1: Manual Deployment (Recommended for Production)

#### Step 1: Prepare Theme Files
1. Download the theme ZIP file
2. Extract the contents to get the `myschoolbuddies` folder
3. Verify all required files are present

#### Step 2: Upload to Keycloak Server
```bash
# Connect to your Keycloak server
ssh user@your-keycloak-server.com

# Navigate to Keycloak themes directory
cd /opt/keycloak/themes/
# OR for Docker installations:
cd /path/to/keycloak/themes/

# Upload the theme folder
scp -r myschoolbuddies user@your-server:/opt/keycloak/themes/
```

#### Step 3: Set Proper Permissions
```bash
# Set ownership to keycloak user
chown -R keycloak:keycloak /opt/keycloak/themes/myschoolbuddies

# Set proper permissions
chmod -R 755 /opt/keycloak/themes/myschoolbuddies
```

#### Step 4: Restart Keycloak
```bash
# For systemd service
sudo systemctl restart keycloak

# For Docker
docker restart keycloak-container

# For standalone server
/opt/keycloak/bin/kc.sh start
```

### Method 2: Docker Volume Mount

#### Step 1: Update Docker Compose
```yaml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    volumes:
      - ./themes/myschoolbuddies:/opt/keycloak/themes/myschoolbuddies
    # ... other configuration
```

#### Step 2: Restart Container
```bash
docker-compose down
docker-compose up -d
```

### Method 3: Admin Console Upload (Keycloak 20+)

1. Access Keycloak Admin Console
2. Go to Realm Settings → Themes
3. Upload the theme ZIP file
4. Apply the theme

## Configuration

### Step 1: Access Admin Console
1. Navigate to your Keycloak admin console
2. Login with administrative credentials
3. Select your realm (e.g., "myschoolbuddies")

### Step 2: Apply Theme
1. Go to **Realm Settings** → **Themes**
2. In the **Login Theme** dropdown, select "myschoolbuddies"
3. In the **Account Theme** dropdown, leave as default or select "myschoolbuddies" if account theme is available
4. Click **Save**

### Step 3: Configure Realm Settings
1. Go to **Realm Settings** → **General**
2. Set **Display name** to "My School Buddies"
3. Set **Frontend URL** to your production domain
4. Enable **User registration** if needed
5. Configure **Login settings** as per requirements

### Step 4: Test Configuration
1. Open a new browser tab/window
2. Navigate to your Keycloak login URL
3. Verify the theme is applied correctly
4. Test login functionality
5. Test registration flow
6. Test password reset flow

## Customization Options

### Branding Updates
Edit `theme.properties` to customize:
```properties
# Brand information
brand.name=Your School Name
brand.tagline=Your Custom Tagline
primary.color=#your-primary-color
secondary.color=#your-secondary-color
```

### Logo and Assets
Replace files in `resources/img/`:
- `logo.png` - 64x64px school logo
- `favicon.ico` - Multi-size favicon

### Color Scheme
Edit `resources/css/login.css`:
```css
:root {
  --primary-color: #your-primary-color;
  --secondary-color: #your-secondary-color;
  /* ... other custom colors */
}
```

## Testing Checklist

### Basic Functionality
- [ ] Login page displays correctly
- [ ] Registration form works
- [ ] Password reset functionality
- [ ] Error messages display properly
- [ ] Success messages display correctly

### Mobile Responsiveness
- [ ] Test on various screen sizes
- [ ] Touch-friendly interface
- [ ] Proper input field sizing
- [ ] Readable text and buttons

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] ARIA labels present

### Performance
- [ ] Fast loading times
- [ ] Optimized images
- [ ] Minified CSS/JS
- [ ] Proper caching headers

## Troubleshooting

### Common Issues

#### Theme Not Appearing
1. Check file permissions
2. Verify theme folder structure
3. Restart Keycloak service
4. Check Keycloak logs for errors

#### CSS/JS Not Loading
1. Verify file paths in `theme.properties`
2. Check browser console for 404 errors
3. Ensure proper MIME types
4. Clear browser cache

#### Login Issues
1. Check realm configuration
2. Verify client settings
3. Review authentication flows
4. Check user registration settings

### Log Files
Check these locations for errors:
- `/opt/keycloak/logs/keycloak.log`
- Docker logs: `docker logs keycloak-container`
- Browser console for frontend errors

## Backup and Rollback

### Backup Current Theme
```bash
# Create backup
cp -r /opt/keycloak/themes/myschoolbuddies /opt/keycloak/themes/myschoolbuddies.backup.$(date +%Y%m%d)
```

### Rollback Procedure
1. Stop Keycloak service
2. Remove or rename current theme folder
3. Restore backup theme
4. Restart Keycloak service
5. Verify functionality

## Security Considerations

### File Permissions
- Theme files should be readable by Keycloak user only
- No execute permissions on static assets
- Proper ownership settings

### Content Security Policy
The theme includes CSP headers for enhanced security:
```properties
content.security.policy=true
frame.options=DENY
xss.protection=true
```

### Production Hardening
1. Disable debug mode in `theme.properties`
2. Enable CSS/JS minification
3. Use HTTPS for all connections
4. Regular security updates

## Monitoring and Maintenance

### Health Checks
1. Monitor theme loading times
2. Check for broken assets
3. Verify mobile compatibility
4. Test periodically after updates

### Updates
1. Test theme updates in staging first
2. Backup before applying updates
3. Monitor for breaking changes
4. Document customizations

## Support

For technical support:
- Check Keycloak documentation
- Review theme source code
- Contact development team
- Create issue in project repository

## Version Information
- Theme Version: 2.2.0
- Keycloak Compatibility: 22.0.0+
- Last Updated: 2024-01-20
- Production Ready: Yes

---

**Important Notes:**
- Always test theme changes in a staging environment first
- Keep backups of working configurations
- Monitor application logs after deployment
- Update theme assets as needed for your school branding
