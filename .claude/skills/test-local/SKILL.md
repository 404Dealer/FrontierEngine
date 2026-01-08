---
name: test-local
description: Reset and restart local development environment for manual testing. Use when you need to test local changes, restart dev servers, rebuild packages, or reset Docker services (PostgreSQL, Redis). Triggers on phrases like "test locally", "restart servers", "reset dev environment".
allowed-tools: Bash, Read, Grep, Glob, TodoWrite
---

# Test Local Development Environment

This skill stops running servers, rebuilds packages, and restarts the development environment so changes can be manually tested. It clears Vite's module cache by completely restarting servers.

## Quick Start (TL;DR)

For most runs, execute these steps in order:
1. **Kill process on port 9000** (MUST DO FIRST):
   - Run `netstat -ano | findstr :9000` to find PID
   - Run `taskkill //F //PID <pid>` to kill it
2. Run `yarn build`
3. **If admin dashboard files changed** (files in `packages/admin/dashboard/`):
   - Run `yarn workspace @medusajs/dashboard build` (REQUIRED - see below)
4. Start backend: `cd dev && npm run dev` (background)
5. Verify server is ready (look for "Server is ready on port: 9000")
6. **Tell user to hard refresh browser** (Ctrl+Shift+R) to clear cached assets

**Admin dashboard is served at http://localhost:9000/app** (integrated with backend, no separate server needed)

### CRITICAL: Dashboard Changes Require Explicit Build

The `medusa develop` command serves **pre-built** dashboard artifacts, NOT live source files. The generic `yarn build` may use Turbo cache and skip the dashboard if it thinks nothing changed. When you modify files in `packages/admin/dashboard/`:

1. You MUST run `yarn workspace @medusajs/dashboard build` explicitly
2. Then restart the dev server
3. Then hard refresh browser (Ctrl+Shift+R)

Without this step, dashboard changes will NOT appear even after restarting the server.

### If `yarn build` fails with memory errors:
1. Skip the full build - don't retry
2. Try starting the server anyway (`cd dev && npm run dev`)
3. It will fail with "Cannot find module '@medusajs/xxx/dist/index.js'" errors
4. Build only those missing modules: `yarn workspace @medusajs/xxx build`
5. Retry starting the server

## Execution Steps

**Use TodoWrite to track progress** - This gives the user visibility into what's happening.

### Step 1: Analyze Changes
Run `git diff --name-only` and `git status --porcelain` to identify what files have changed.

Categorize changes:
- **Infrastructure changes**: `docker-compose.yml`, `.env` files
- **Model changes**: Files in `packages/modules/*/src/models/`
- **Package changes**: Any files in `packages/`
- **Admin changes**: Files in `packages/admin/dashboard/`
- **Dev config changes**: Files in `dev/`

### Step 2: Stop Running Services (CRITICAL)

**ALWAYS kill the process on port 9000 before starting the server.** This is the most common cause of "EADDRINUSE" errors.

**Step 2a: Find the PID using port 9000**
```bash
netstat -ano | findstr :9000
```

Look for `LISTENING` entries - the last column is the PID. Example output:
```
TCP    0.0.0.0:9000    0.0.0.0:0    LISTENING    448660
```

**Step 2b: Kill the process by PID**
```bash
taskkill //F //PID <pid>
```
Note: Use `//F` and `//PID` (double slashes) because Claude's Bash tool uses Git Bash.

**Alternative (if no specific process found):**
```bash
taskkill //F //IM node.exe 2>nul || echo "No node processes to kill"
```

This is CRITICAL for fixing the Vite caching issue - the dev server caches modules and won't pick up changes to dependency files unless completely restarted.

**If you get EADDRINUSE error when starting the server**, you forgot to kill the old process. Go back and kill it.

### Step 3: Docker Management (Skip if possible)

**OPTIMIZATION**: Docker commands are slow on Windows. Skip Docker checks unless:
- Infrastructure files changed (docker-compose.yml, .env)
- User explicitly mentions Docker issues
- Backend fails to start with connection errors

If Docker restart is needed:
```bash
cd dev && docker-compose up -d
```

**Don't wait for health checks** - the backend startup will fail fast if Docker isn't ready, and that's a clearer signal than slow health check commands.

### Step 4: Build Packages
From the project root, build all packages to compile any changes:
```bash
yarn build
```

**If build fails with memory errors** (common on Windows), use the recovery strategy below instead of retrying.

**Common build errors:**
- JSX errors in `.tsx` files: Check that `packages/medusa/tsconfig.json` has `"jsx": "react-jsx"` in compilerOptions
- Memory errors: "Array buffer allocation failed" or "Zone Allocation failed - process out of memory"

### Step 4b: Build Dashboard (REQUIRED if admin files changed)

**IMPORTANT:** If any files in `packages/admin/dashboard/` were modified, you MUST explicitly build the dashboard:
```bash
yarn workspace @medusajs/dashboard build
```

**Why this is necessary:**
- `medusa develop` serves **pre-built** dashboard artifacts from the `dist/` folder
- It does NOT use live source files or hot reload for dashboard changes
- The generic `yarn build` may skip the dashboard due to Turbo cache
- Without this explicit build, your dashboard changes will NOT appear

**When to run this:**
- Any change to files in `packages/admin/dashboard/src/`
- Changes to dashboard hooks, routes, components, translations, etc.
- Even small UI changes like adding a banner or changing text

#### Memory Error Recovery: Build Missing Modules Individually

When `yarn build` fails due to memory exhaustion, skip the full build and proceed to Step 7 (Start Dev Server). The server will fail with specific "Cannot find module" errors that tell you exactly which modules need building.

**Step 4a: Attempt to start server (it will fail, but tells you what's missing)**
The error will look like:
```
Cannot find module '@medusajs/stock-location/dist/index.js'
Cannot find module '@medusajs/product/dist/index.js'
```

**Step 4b: Build only the missing modules one at a time:**
```bash
yarn workspace @medusajs/stock-location build
yarn workspace @medusajs/product build
yarn workspace @medusajs/promotion build
yarn workspace @medusajs/sales-channel build
yarn workspace @medusajs/store build
yarn workspace @medusajs/notification build
```

Each individual module build uses much less memory than the parallel full build. Build only the modules that appeared in the error messages.

**Step 4c: Retry starting the server** - It should now succeed.

### Step 5: Lint Check (SKIP BY DEFAULT)

**SKIP lint unless explicitly requested.** The codebase is large and `yarn lint` often runs out of memory:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

If lint is needed, run with increased memory:
```bash
NODE_OPTIONS="--max-old-space-size=8192" yarn lint
```

### Step 6: Database Migrations (Auto-migrate)
If model files changed (files in `packages/modules/*/src/models/`), run migrations:
```bash
cd dev && npm run db:migrate
```

### Step 7: Start Dev Server (Background)

Start Medusa backend in background:
```bash
cd dev && npm run dev
```
Run this in background mode.

**The backend serves everything:**
- API: http://localhost:9000
- Admin Dashboard: http://localhost:9000/app

No separate admin server needed - the admin dashboard is bundled and served by the Medusa backend.

### Step 8: Verify & Report
Wait ~10 seconds for server to initialize, then check TaskOutput for the background process.

Look for in backend output:
- "Server is ready on port: 9000"
- "Admin URL → http://localhost:9000/app"

**IMPORTANT: Remind user to hard refresh browser (Ctrl+Shift+R)** to clear cached assets, especially if dashboard changes were made.

Report final status in a table format:

| Component | Status | URL |
|-----------|--------|-----|
| Medusa Backend | Running/Failed | http://localhost:9000 |
| Admin Dashboard | Running/Failed | http://localhost:9000/app |
| PostgreSQL | Running | Port 5433 |
| Redis | Running | Port 6380 |

## Service Reference

| Service | Port | Health Check |
|---------|------|--------------|
| PostgreSQL | 5433 | Backend connects or fails |
| Redis | 6380 | Backend connects or fails |
| Medusa Backend + Admin | 9000 | "Server is ready" in output |

## Error Handling

- **Docker not running**: Backend will fail with connection errors - tell user to start Docker Desktop
- **Build fails with memory error**: Use the individual module build strategy (see Step 4). Don't retry `yarn build` - it will fail again.
- **Build fails with code error**: Report error details and stop (don't start server)
- **Lint out of memory**: Skip lint, it's not blocking
- **Migrations fail**: Report error but continue with server startup
- **Server fails with "Cannot find module"**: Build the missing modules individually with `yarn workspace @medusajs/<module-name> build`

## Why This Skill Exists

The Vite dev server and Medusa backend cache modules in memory. When you modify a package that other packages depend on:
1. The old cached version continues to be served
2. Your fix appears to not take effect
3. You need to completely restart the servers to load fresh code

This skill automates the full restart cycle: stop servers -> rebuild -> restart fresh.

## Lessons Learned

1. **ALWAYS kill port 9000 first** - Use `netstat -ano | findstr :9000` to find PID, then `taskkill //F //PID <pid>`. The generic `taskkill /F /IM node.exe` often doesn't work.
2. **Docker commands are slow on Windows** - Avoid `docker ps`, `docker exec` health checks. Trust the backend to fail fast if Docker isn't ready.
3. **Skip lint by default** - It exhausts memory on large codebases.
4. **Admin is integrated** - No separate admin server needed. The backend at localhost:9000/app serves the admin dashboard.
5. **Use TodoWrite** - Gives user visibility into multi-step process.
6. **PowerShell vs Bash** - User runs PowerShell, not bash. `&&` doesn't work in PowerShell; use `;` or separate commands. Claude's Bash tool uses Git Bash so `&&` works there, but if user copies commands they need PowerShell syntax.
7. **EADDRINUSE means port 9000 wasn't killed** - Go back and kill the process properly before retrying.
8. **When full build fails with memory errors, build missing modules individually** - Don't retry `yarn build`. Instead, try starting the server - it will tell you exactly which modules are missing via "Cannot find module '@medusajs/<name>/dist/index.js'" errors. Then build just those modules with `yarn workspace @medusajs/<name> build`. This uses far less memory than the parallel full build.
9. **Common modules that need building** - stock-location, product, promotion, sales-channel, store, notification are frequently missing after a failed full build. The Turbo cache preserves ~40+ packages, so only ~6-10 typically need individual building.
10. **Dashboard changes require explicit build** - `medusa develop` serves PRE-BUILT dashboard artifacts, not live source. The generic `yarn build` may skip dashboard due to Turbo cache. ALWAYS run `yarn workspace @medusajs/dashboard build` when any file in `packages/admin/dashboard/` changes. Without this, dashboard changes will NOT appear.
11. **Hard refresh browser after dashboard changes** - Tell user to press Ctrl+Shift+R to clear cached assets. The browser may serve stale JavaScript even after rebuilding.
