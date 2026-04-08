
## Root Cause Analysis

1. **Pending approval blocking all users**: Since Keycloak creates users with `enabled: false`, disabled users literally CANNOT authenticate. So any user who successfully logs in via Keycloak is already approved. The current status check in ProtectedRoute is incorrectly blocking authenticated users.

2. **Logout URL**: Missing `id_token_hint` parameter for clean Keycloak logout.

3. **Super Admin dashboard errors**: It fetches from external API (`schoolapi.hostingmanager.in`) which returns 404. Dashboards should use Supabase data (schools table has real data).

4. **School Admin dashboard**: Uses all hardcoded/mock data instead of real data.

## Fixes

1. **ProtectedRoute** - Remove approval status check. If user authenticates via Keycloak, they're approved.
2. **OAuth2Callback** - Always redirect to dashboard on success (no pending check).
3. **auth.ts** - Store id_token for logout, fix logout URL.
4. **PlatformAdminDashboard** - Rewrite to fetch schools/school_requests from Supabase directly.
5. **useDashboardData** - Fetch stats from Supabase instead of external API.
6. **SchoolAdminDashboard** - Connect to real data.
7. **Add RLS policies** - Allow admins to read/update school_requests.
