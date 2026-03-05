

# Comprehensive Project Stabilization Plan

This is a large project with an external backend (Express/Prisma), external PostgreSQL database, and Keycloak authentication. The Lovable preview only runs the frontend -- your backend at `schoolapi.hostingmanager.in` must be running for most features to work. Here is a prioritized, phased plan.

---

## Phase 1: Fix Registration Page (Critical -- Currently Broken)

**Problem:** The `RegistrationWizard` calls `VITE_API_URL/registration/init` on mount. This fails with a network error because the external backend is unreachable from the Lovable preview (CORS or server down), leaving the page stuck on a spinner.

**Fix:**
- Remove the mandatory session initialization. Make the registration wizard work client-side first (collect all data), then submit to the backend only on final step.
- Add a fallback: if `/registration/init` fails, still allow the user to proceed through the form steps locally.
- Show a clear error message instead of an infinite spinner when the backend is unreachable.
- Ensure the form validates inputs client-side before attempting any API call.

---

## Phase 2: Sanitize Supabase Usage

**Problem:** Supabase is only used in one place (`src/services/apiService.ts`) as a CORS proxy via the `api-proxy` edge function. The rest of the app uses direct `fetch` calls to `schoolapi.hostingmanager.in`. This creates confusion.

**Fix:**
- Keep the `api-proxy` edge function as-is -- it solves CORS issues for the Lovable preview.
- Update `src/lib/api.ts` (the `ApiClient` class) to route requests through the edge function proxy when running in the Lovable preview environment, and directly when running locally/Docker.
- Remove duplicate API service logic in `src/services/apiService.ts` where it overlaps with `src/lib/api.ts`. Consolidate into one API layer.
- Do NOT remove the Supabase client file or types file (they are auto-generated and required by Lovable Cloud).

---

## Phase 3: Fix Dashboard Routing and Navigation

**Problem:** Multiple dashboard pages exist but some routes may lead to dead ends or broken pages when backend data is unavailable.

**Fix:**
- Add graceful loading/error states to every dashboard page so they don't crash when the API is unreachable.
- Verify all sidebar navigation links in `ProductionDashboardLayout` match actual routes in `App.tsx`.
- Remove debug/test routes from production (`/schools-test`, `/schools-debug`, `/api-test`, `/api-integration-test`) or gate them behind a dev flag.
- Ensure the `/dashboard/welcome` route works for first-time users.

---

## Phase 4: Make School Filters Work with Edge Function Proxy

**Problem:** School filter dropdowns are empty because the frontend calls endpoints like `/api/states`, `/api/comprehensive-stats` etc. that either don't exist on the external API or are blocked by CORS.

**Fix:**
- Route all school-related API calls through the `api-proxy` edge function when in the Lovable preview.
- Add error handling and "no data available" states to filter dropdowns so they don't appear broken.
- Ensure `useSchoolsQuery`, `useDistrictsOptions`, and related hooks handle API failures gracefully.

---

## Phase 5: UI Polish and Responsiveness

- Audit all pages for mobile responsiveness (sidebar, tables, forms).
- Fix dropdown z-index issues in filter components.
- Ensure consistent theming across light/dark mode toggle.
- Add proper loading skeletons instead of raw spinners.

---

## Phase 6: Environment Variables and Docker Cleanup

**Problem:** Sensitive credentials (DB passwords, API keys, SendGrid keys, Keycloak admin credentials) are committed in `.env`, `backend/.env`, `backend/.env.production`, and `.env.production`.

**Fix:**
- Create a clean `.env.example` with placeholder values only (no real credentials).
- Document which env vars are required for each environment.
- Update Docker files to reference env vars properly without hardcoded secrets.
- Ensure `docker-compose.yml` works with the cleaned env structure.

---

## Phase 7: Security Audit

- Remove all hardcoded credentials from committed files.
- Ensure the Keycloak JWT token is validated properly (currently using `jwt.decode` without verification in `backend/src/middleware/keycloak.ts`).
- Add HTTPS enforcement in production nginx config.
- Validate all user inputs with zod schemas on both frontend forms and backend endpoints.

---

## What Cannot Be Done in Lovable

The following items from your list require work outside Lovable:
- **Backend deployment**: Express/Prisma backend must be deployed and maintained on your server.
- **Database migrations**: Must be run against your external PostgreSQL instance.
- **Keycloak configuration**: Must be done in your Keycloak admin console.
- **Docker testing**: Docker builds must be tested on your infrastructure.
- **Load testing and scalability**: Requires server-side tools.
- **Backup and recovery**: Must be configured on your database/server infrastructure.

---

## Recommended Implementation Order

| Priority | Phase | Effort |
|----------|-------|--------|
| 1 | Fix Registration Page | Small |
| 2 | Sanitize API Layer / Proxy | Medium |
| 3 | Fix Dashboard Routing | Small |
| 4 | School Filters via Proxy | Medium |
| 5 | UI Polish | Medium |
| 6 | Env Vars Cleanup | Small |
| 7 | Security Audit | Medium |

Shall I start implementing Phase 1 (fix the broken registration page)?

