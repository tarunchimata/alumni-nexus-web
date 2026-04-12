# GitHub Issues Template for Execution Plan

## **Issue #1: Remove Mock Data & Connect Real APIs**

**Type:** Bug  
**Priority:** Critical  
**Phase:** 1.1  

### **Problem Description**
Dashboards are showing mock/static data instead of real backend data. This prevents users from seeing actual platform information.

### **Current State**
- RoleDashboard.tsx uses hardcoded numbers
- useDashboardData.ts returns mock responses
- No API authentication implemented

### **Expected State**
- All dashboard data comes from real backend APIs
- Proper JWT authentication on all API calls
- Role-based data filtering

### **Files to Modify**
- `src/components/dashboards/RoleDashboard.tsx`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useRoleTheme.ts`

### **Acceptance Criteria**
- [ ] Remove all mock data from RoleDashboard.tsx
- [ ] Implement real API calls in useDashboardData.ts
- [ ] Add JWT authentication headers
- [ ] Add role-based data filtering
- [ ] Implement loading states and error handling
- [ ] Test with all user roles (Super Admin, School Admin, Teacher, Student, Alumni)

### **API Endpoints Required**
```
GET /api/dashboard/stats/{role}
GET /api/dashboard/users/{role}
GET /api/dashboard/schools
GET /api/dashboard/activity
```

### **Dependencies**
- Backend API endpoints must be implemented
- JWT authentication working
- Role extraction from Keycloak JWT

---

## **Issue #2: Role-Based Dashboard Validation**

**Type:** Feature  
**Priority:** Critical  
**Phase:** 1.2  

### **Problem Description**
Users are not seeing role-appropriate dashboard content. Role extraction and routing needs validation.

### **Current State**
- Role extraction from JWT may be incorrect
- Dashboard routing not properly role-based
- Potential cross-role data leakage

### **Expected State**
- Correct role extraction from Keycloak JWT
- Proper routing after login based on role
- Each role sees only permitted data

### **Files to Modify**
- `src/lib/auth-fixed.ts`
- `src/components/dashboards/RoleDashboard.tsx`
- `src/App.tsx` (routing)

### **Acceptance Criteria**
- [ ] Fix role extraction from Keycloak JWT
- [ ] Validate role mapping (SUPER_ADMIN -> platform_admin, etc.)
- [ ] Ensure proper routing after login
- [ ] Test each role sees correct dashboard
- [ ] Verify no cross-role data leakage
- [ ] Add role-based route guards

### **Test Cases**
- Super Admin sees platform-wide stats
- School Admin sees only their school data
- Teacher sees their classes and students
- Student sees their enrolled classes
- Alumni sees alumni-specific features

---

## **Issue #3: Full CRUD Data Integrity**

**Type:** Feature  
**Priority:** High  
**Phase:** 2.1  

### **Problem Description**
CRUD operations may not be properly persisting or reflecting data across the platform.

### **Expected State**
All create, read, update, delete operations work correctly and data is consistent across dashboards.

### **Modules to Validate**
- Schools management
- Users management
- Alumni management
- Posts/Content management
- Classes management

### **Acceptance Criteria**
- [ ] Create operations persist correctly in DB
- [ ] Read operations return accurate, up-to-date data
- [ ] Update operations reflect immediately across all views
- [ ] Delete operations work (soft/hard as per design)
- [ ] Data consistency across all dashboards
- [ ] No stale or cached mock responses

### **Test Cases**
- Create new school and verify it appears in dashboard
- Update user information and verify changes reflect
- Delete alumni and verify removal from lists
- Create post and verify it appears in feeds

---

## **Issue #4: Keycloak Integration Fixes**

**Type:** Bug  
**Priority:** High  
**Phase:** 3.2  

### **Problem Description**
Keycloak integration has UI/UX issues and potential authentication flow problems.

### **Current Issues**
- UI shows "Change Password in Keycloak" (should be "Change Password")
- Login flow may have edge cases
- Token refresh mechanism needs validation

### **Expected State**
Seamless Keycloak integration with clean UX.

### **Files to Modify**
- `src/components/auth/`
- `src/lib/auth-fixed.ts`
- Backend auth routes

### **Acceptance Criteria**
- [ ] Change UI label to "Change Password"
- [ ] Validate login flow (OAuth2 + PKCE)
- [ ] Test token refresh mechanism
- [ ] Validate logout flow
- [ ] Fix role mapping issues
- [ ] Test edge cases (expired tokens, network errors)

---

## **Issue #5: Social Platform Features Implementation**

**Type:** Feature  
**Priority:** Medium  
**Phase:** 4.1  

### **Problem Description**
Platform needs social engagement features within school boundaries.

### **Features to Implement**
- Live Posts (Students/Teachers)
- Real-time Chat (within school/class)
- Notifications system
- Live updates feed
- Student "Wall" (social media style)

### **Acceptance Criteria**
- [ ] Posts creation and display system
- [ ] Real-time chat functionality
- [ ] Notification system (in-app and email)
- [ ] Activity feed with updates
- [ ] Student profile walls
- [ ] School-level isolation (no cross-school visibility)
- [ ] Class-based visibility where appropriate

### **Technical Requirements**
- WebSocket support for real-time features
- Notification queue system
- Content moderation tools
- Privacy controls

---

## **Issue #6: Production Docker Setup**

**Type:** Infrastructure  
**Priority:** Medium  
**Phase:** 5.2  

### **Problem Description**
Docker setup needs to be production-ready with proper configuration.

### **Requirements**
- Production-ready Dockerfile
- Complete docker-compose.yml
- Environment-based configs
- Health checks
- SSL support

### **Files to Create/Modify**
- `Dockerfile.frontend`
- `backend/Dockerfile`
- `docker-compose.prod.yml`
- `nginx.conf`
- `.env` files

### **Acceptance Criteria**
- [ ] Multi-stage Docker builds
- [ ] Proper environment variable handling
- [ ] Health checks for all services
- [ ] SSL/HTTPS support
- [ ] Volume management for logs/uploads
- [ ] Production security configurations
- [ ] Deployment documentation

---

## **Issue #7: Security Hardening**

**Type:** Security  
**Priority:** High  
**Phase:** 5.1  

### **Problem Description**
Platform needs comprehensive security validation and hardening.

### **Requirements**
- JWT validation on all APIs
- Role-based access control (RBAC)
- Secure API endpoints
- Input validation & sanitization
- Data encryption

### **Acceptance Criteria**
- [ ] JWT token validation middleware
- [ ] RBAC implementation on all routes
- [ ] API rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CORS configuration
- [ ] Security headers implementation

### **Security Checklist**
- [ ] Authentication middleware
- [ ] Authorization checks
- [ ] Input validation
- [ ] Output encoding
- [ ] Error handling (no info leakage)
- [ ] Logging and monitoring
