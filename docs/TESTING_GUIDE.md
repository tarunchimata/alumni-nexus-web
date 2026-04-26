# My School Buddies - Testing Guide

## Overview

This guide covers comprehensive testing of the My School Buddies application.

## Testing Tools

### 1. Automated Test Script

Use the menu-based testing script:

```bash
cd docker/scripts
./test.sh
```

### 2. Test Categories

#### Database Tests
- Database connectivity
- Prisma schema validation
- Data integrity checks

#### Backend API Tests
- Health endpoint validation
- Authentication testing
- API security verification
- School search functionality

#### Frontend Tests
- Application availability
- Page rendering
- User interface functionality

#### Integration Tests
- End-to-end workflows
- Authentication flows
- Data synchronization

## Test Scenarios

### 1. Database Connection Test

Validates database connectivity and schema:

```bash
# Option 1: Test Database Connection
./test.sh
```

**Expected Results:**
- ✅ Database connection successful
- ✅ Prisma schema synchronized
- ✅ School data accessible

### 2. Backend Health Test

Validates backend API functionality:

```bash
# Option 2: Test Backend Health API
./test.sh
```

**Expected Results:**
- ✅ Health endpoint responding
- ✅ Database connection active
- ✅ Keycloak configuration valid
- ✅ Features enabled

### 3. Frontend Availability Test

Validates frontend application:

```bash
# Option 3: Test Frontend Availability
./test.sh
```

**Expected Results:**
- ✅ Frontend accessible at port 8080
- ✅ Main page loading
- ✅ Static assets serving

### 4. Authentication Flow Test

Validates Keycloak integration:

```bash
# Option 4: Test Keycloak Authentication
./test.sh
```

**Expected Results:**
- ✅ Keycloak server accessible
- ✅ OAuth2 configuration valid
- ✅ Backend integration working

### 5. School Search API Test

Validates school search functionality:

```bash
# Option 5: Test School Search API
./test.sh
```

**Expected Results:**
- ✅ API endpoint available
- ✅ Authentication required (security check)
- ✅ Search functionality working

### 6. Registration Flow Test

Validates user registration:

```bash
# Option 6: Test Alumni Registration Flow
./test.sh
```

**Expected Results:**
- ✅ Registration endpoint available
- ✅ Multi-step registration enabled
- ✅ Validation working

### 7. Approval System Test

Validates admin approval workflow:

```bash
# Option 7: Test Admin Approval Flow
./test.sh
```

**Expected Results:**
- ✅ Approval system features enabled
- ✅ Workflow validation working

### 8. CSV Upload Test

Validates bulk data upload:

```bash
# Option 8: Test CSV Upload
./test.sh
```

**Expected Results:**
- ✅ CSV upload endpoint available
- ✅ Bulk upload feature enabled
- ✅ File validation working

### 9. Docker Container Test

Validates container health:

```bash
# Option 9: Test Docker Container Health
./test.sh
```

**Expected Results:**
- ✅ Containers running
- ✅ Health checks passing
- ✅ Resource allocation normal

### 10. End-to-End Test

Complete application validation:

```bash
# Option 10: Full End-to-End Validation
./test.sh
```

**Expected Results:**
- ✅ All services running
- ✅ Frontend ↔ Backend ↔ Database working
- ✅ Authentication flow complete
- ✅ User workflows functional

## Test Reports

### Generating Reports

```bash
# Option 11: Generate Test Report
./test.sh
```

Report includes:
- Test execution summary
- Pass/fail statistics
- Success rate percentage
- Detailed log references

### Report Location

Test reports are saved in:
```
docker/logs/test-report-YYYYMMDD-HHMMSS.log
```

## Manual Testing

### Browser Testing

1. **Frontend Access**: http://localhost:8080
2. **Login Flow**: Test Keycloak authentication
3. **Dashboard**: Verify role-based access
4. **School Search**: Test search functionality
5. **User Registration**: Test new user flow

### API Testing

1. **Health Check**: http://localhost:3033/health
2. **Authentication**: Test OAuth2 flow
3. **API Security**: Verify authentication requirements
4. **Data Validation**: Test input validation

## Troubleshooting

### Common Test Failures

1. **Database Connection**
   - Check DATABASE_URL in docker/.env
   - Verify database server accessibility
   - Confirm credentials

2. **Backend Health**
   - Check if backend container is running
   - Verify port 3033 availability
   - Review backend logs

3. **Frontend Availability**
   - Check if frontend container is running
   - Verify port 8080 availability
   - Review nginx configuration

4. **Authentication Issues**
   - Verify Keycloak server accessibility
   - Check client configuration
   - Review redirect URIs

### Debug Mode

For detailed debugging:
1. Enable debug logging
2. Check container logs
3. Use browser developer tools
4. Review network requests

## Continuous Testing

### Automated Testing

Schedule regular tests:
```bash
# Add to crontab for daily health checks
0 */6 * * * cd /path/to/project/docker/scripts && ./test.sh << EOF
10
11
EOF
```

### Monitoring

Set up monitoring alerts for:
- Service availability
- Response times
- Error rates
- Resource usage

## Best Practices

1. **Test Before Deployment**: Always run full test suite
2. **Document Results**: Keep test reports for reference
3. **Monitor Regularly**: Schedule periodic health checks
4. **Update Tests**: Keep test cases current with features
5. **Backup Data**: Test with backup data regularly
