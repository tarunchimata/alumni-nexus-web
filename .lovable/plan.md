

# Comprehensive Project Stabilization Plan

This is a large project with an external backend (Express/Prisma), external PostgreSQL database, and Keycloak authentication. The Lovable preview only runs the frontend -- your backend at `schoolapi.hostingmanager.in` must be running for most features to work. Here is a prioritized, phased plan.

---

## Phase 1: Fix Registration Page ✅ DONE

- Removed blocking `/registration/init` session call on mount
- Registration wizard now works fully client-side (collects all data across 4 steps)
- Only submits to backend on final step via `/registration/complete`
- Added error display with retry button on step 4
- Step 2 (school search) gracefully handles API failures with manual school name entry
- Step 3 (username) removed blocking username availability check — validates client-side only
- No more infinite spinner when backend is unreachable

---

## Phase 2: Sanitize Supabase Usage

**Status:** Pending

**Fix:**
- Keep the `api-proxy` edge function as-is -- it solves CORS issues for the Lovable preview.
- Update `src/lib/api.ts` (the `ApiClient` class) to route requests through the edge function proxy when running in the Lovable preview environment, and directly when running locally/Docker.
- Remove duplicate API service logic in `src/services/apiService.ts` where it overlaps with `src/lib/api.ts`. Consolidate into one API layer.
- Do NOT remove the Supabase client file or types file (they are auto-generated and required by Lovable Cloud).

---

## Phase 3: Fix Dashboard Routing and Navigation

**Status:** Pending

---

## Phase 4: Make School Filters Work with Edge Function Proxy

**Status:** Pending

---

## Phase 5: UI Polish and Responsiveness

**Status:** Pending

---

## Phase 6: Environment Variables and Docker Cleanup

**Status:** Pending

---

## Phase 7: Security Audit

**Status:** Pending

---

## What Cannot Be Done in Lovable

- **Backend deployment**: Express/Prisma backend must be deployed and maintained on your server.
- **Database migrations**: Must be run against your external PostgreSQL instance.
- **Keycloak configuration**: Must be done in your Keycloak admin console.
- **Docker testing**: Docker builds must be tested on your infrastructure.
- **Load testing and scalability**: Requires server-side tools.
- **Backup and recovery**: Must be configured on your database/server infrastructure.
