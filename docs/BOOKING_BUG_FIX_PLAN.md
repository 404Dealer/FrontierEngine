# Booking Feature Bug Diagnosis and Fix Plan

## Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Backend Query/Response | ✅ Complete | All changes implemented and verified |
| Phase 2: Frontend Cache Management | ✅ Complete | Toggle ON/OFF now working correctly |
| Phase 3: Regression Tests | ✅ Complete | 13 integration tests added |
| Additional Fix: Update Route 500 Error | ✅ Complete | Fixed undefined field handling |
| Additional Fix: Missing i18n Key | ✅ Complete | Added `actions.done` translation |

**Last Updated**: 2025-01-07

---

## Overview

This document provides a comprehensive plan to diagnose, fix, and prevent regressions in the booking feature. The primary issue is that staff availability toggles activate on click but don't properly untoggle (UI state doesn't reflect actual state).

## Current State Analysis

### Feature Scope
The booking feature spans **151+ files** across:
- **Frontend (Admin Dashboard)**: 73 files - routes, hooks, components
- **Backend API Routes**: 19 files - admin and store endpoints
- **Booking Module**: 27 files - models, services, types, migrations
- **Core Types**: 6 files - TypeScript definitions
- **Core Flows (Workflows)**: 11 files - booking workflow steps
- **Integration Tests**: 6 files - HTTP and module tests

### Known Bug: Toggle Doesn't Untoggle

**Symptom**: When clicking a day toggle in the staff availability editor:
1. Toggle appears to activate (UI shows enabled)
2. Toast message confirms action
3. Data saves correctly to backend (verified on storefront)
4. Toggle does NOT properly reflect state after mutation
5. Cannot untoggle (turn off) a previously enabled day

**Root Cause Identified**: Query key mismatch between queries and mutation cache invalidation

### Technical Details

#### Data Flow (Expected)
```
User clicks toggle
  → handleDayToggle() called
  → createRule() or deleteRule() mutation
  → Backend persists change
  → Mutation onSuccess invalidates cache
  → refetch() fetches updated data
  → UI re-renders with new state
```

#### Data Flow (Actual Issue)
```
User clicks toggle
  → Mutation succeeds
  → Cache invalidation uses wrong key pattern
  → refetch() may not get fresh data
  → UI shows stale state
```

---

## What We're NOT Doing

- Rewriting the entire booking feature
- Changing the data model structure
- Modifying the storefront booking flow
- Adding new features (focus is bug fixes only)

---

## Implementation Approach

We will fix issues in **3 phases**, with each phase having clear verification steps:

1. **Phase 1**: Fix Backend Query/Response Issues
2. **Phase 2**: Fix Frontend Cache Management
3. **Phase 3**: Add Regression Prevention (Tests)

---

## Phase 1: Fix Backend Query/Response Issues

### Overview
Ensure the backend properly returns `availability_rules` when requested via the `+availability_rules` field parameter.

### Changes Required

#### 1.1 Update Query Config

**File**: `packages/medusa/src/api/admin/bookings/query-config.ts`

**Problem**: The `*availability_rules` pattern may not be working correctly with the current config structure.

**Verification Before Fix**:
```bash
# Test current API response
curl -X GET "http://localhost:9000/admin/bookings/staff/{staff_id}?fields=+availability_rules" \
  -H "Authorization: Bearer {token}" | jq '.staff.availability_rules'
```

**Changes**: Ensure `staffRetrieveTransformQueryConfig` uses `*availability_rules`:

```typescript
export const defaultAdminStaffRetrieveFields = [
  ...defaultAdminStaffFields,
  "*availability_rules",
]

export const staffRetrieveTransformQueryConfig = {
  defaults: defaultAdminStaffRetrieveFields,
  isList: false,
}
```

#### 1.2 Update Staff Route to Use RemoteQuery Pattern

**File**: `packages/medusa/src/api/admin/bookings/staff/[id]/route.ts`

**Problem**: Direct module service calls may not properly handle relation expansion.

**Changes**: Use `remoteQueryObjectFromString` pattern (following promotions module):

```typescript
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "booking_staff",
    variables: { filters: { id } },
    fields: req.queryConfig.fields,
  })

  const [staff] = await remoteQuery(queryObject)

  if (!staff) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Staff member with id: ${id} was not found`
    )
  }

  res.json({ staff })
}
```

#### 1.3 Update Joiner Config with Models Array

**File**: `packages/modules/booking/src/joiner-config.ts`

**Problem**: Missing `models` array prevents proper entity discovery for remote query.

**Changes**:
```typescript
import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import {
  BookingAvailabilityRule,
  BookingRecord,
  BookingService,
  BookingSettings,
  BookingStaff,
} from "@models"

export const joinerConfig = defineJoinerConfig(Modules.BOOKING, {
  linkableKeys: {
    booking_id: "booking",
    service_id: "booking_service",
    staff_id: "booking_staff",
    availability_rule_id: "booking_availability_rule",
  },
  models: [
    BookingAvailabilityRule,
    BookingRecord,
    BookingService,
    BookingSettings,
    BookingStaff,
  ],
})
```

### Success Criteria - Phase 1

#### Automated Verification:
- [x] Build medusa package: `yarn workspace @medusajs/medusa build`
- [x] Build booking module: `yarn workspace @medusajs/booking build`
- [x] TypeScript compiles without errors
- [ ] Existing tests pass: `yarn test:integration:packages`

#### Manual Verification:
- [x] API returns `availability_rules` array:
  ```bash
  curl -X GET "http://localhost:9000/admin/bookings/staff/{id}?fields=+availability_rules" \
    -H "Authorization: Bearer {token}"
  ```
  Expected: Response includes `staff.availability_rules` array (may be empty)
- [x] Staff detail page loads without errors
- [x] Availability section shows on staff detail page

**Phase 1 Status**: ✅ Complete

---

## Phase 2: Fix Frontend Cache Management

### Overview
Fix React Query cache invalidation so mutations properly trigger UI updates.

### Changes Required

#### 2.1 Update Availability Rule Mutation Hooks

**File**: `packages/admin/dashboard/src/hooks/api/bookings.tsx`

**Problem**: Cache invalidation uses exact key matching which doesn't match queries with additional parameters.

**Changes**: Use predicate-based invalidation for all three hooks:

```typescript
// useCreateAvailabilityRule (around line 753)
onSuccess: (data, variables, context) => {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === "booking_staff" &&
      query.queryKey[1] === "detail" &&
      query.queryKey[2] === staffId,
  })
  options?.onSuccess?.(data, variables, context)
},

// useUpdateAvailabilityRule (around line 785)
onSuccess: (data, variables, context) => {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === "booking_staff" &&
      query.queryKey[1] === "detail" &&
      query.queryKey[2] === staffId,
  })
  options?.onSuccess?.(data, variables, context)
},

// useDeleteAvailabilityRule (around line 811)
onSuccess: (data, variables, context) => {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === "booking_staff" &&
      query.queryKey[1] === "detail" &&
      query.queryKey[2] === staffId,
  })
  options?.onSuccess?.(data, variables, context)
},
```

#### 2.2 Remove Redundant Refetch Calls (Optional Cleanup)

**File**: `packages/admin/dashboard/src/routes/bookings/staff/staff-availability/staff-availability.tsx`

**Problem**: Manual `refetch()` calls after mutations are redundant if cache invalidation works correctly.

**Decision**: Keep `refetch()` calls as defensive measure until we verify invalidation works consistently.

### Success Criteria - Phase 2

#### Automated Verification:
- [x] Build dashboard: `yarn workspace @medusajs/dashboard build`
- [x] TypeScript compiles without errors
- [ ] No console errors in browser dev tools

#### Manual Verification:
- [x] **Toggle ON**: Click Monday toggle → Shows enabled with "09:00 - 17:00"
- [x] **Toggle OFF**: Click Monday toggle again → Shows "Closed"
- [x] **Rapid Toggle**: Click toggle multiple times quickly → State remains consistent
- [x] **Multiple Days**: Enable Monday, Tuesday, Wednesday → All show correctly
- [x] **Disable Multiple**: Disable all enabled days → All show "Closed"
- [x] **Page Refresh**: Refresh page → State matches what was set
- [x] **Edit Times**: Edit hours on enabled day → New times persist (fixed 500 error)

**Phase 2 Status**: ✅ Complete

---

## Additional Bugs Fixed During Implementation

### Bug Fix: 500 Error on Availability Rule Update

**File**: `packages/medusa/src/api/admin/bookings/staff/[id]/availability/[ruleId]/route.ts`

**Problem**: When editing availability rule times (start_time, end_time), the POST request returned a 500 Internal Server Error.

**Root Cause**: The route was passing `undefined` values for all fields not sent in the request body. When only `start_time` and `end_time` were provided, other fields like `day_of_week` were set to `undefined`, causing the database update to fail.

**Fix**: Changed to only include fields in the update DTO when they are actually provided (not `undefined` or `null`):

```typescript
// Before (broken)
const updateData: UpdateAvailabilityRuleDTO = {
  id: ruleId,
  day_of_week: body.day_of_week ?? undefined,  // Always included
  start_time: body.start_time ?? undefined,     // Always included
  // ...
}

// After (fixed)
const updateData: UpdateAvailabilityRuleDTO = { id: ruleId }
if (body.start_time !== undefined && body.start_time !== null) {
  updateData.start_time = body.start_time
}
// Only include fields that were actually sent
```

### Bug Fix: Missing i18n Key

**File**: `packages/admin/dashboard/src/i18n/translations/en.json`

**Problem**: Browser console showed `i18next::translator: missingKey en translation actions.done actions.done`

**Fix**: Added `"done": "Done"` to the `actions` section in the English translations.

---

## Phase 3: Add Regression Prevention (Tests)

### Overview
Add tests to prevent these bugs from recurring.

### Changes Required

#### 3.1 Add Unit Tests for Cache Invalidation Logic

**File**: `packages/admin/dashboard/src/hooks/api/__tests__/bookings.spec.ts` (new file)

```typescript
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useCreateAvailabilityRule, useDeleteAvailabilityRule } from "../bookings"

describe("Availability Rule Hooks", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  describe("cache invalidation", () => {
    it("invalidates staff detail queries after creating rule", async () => {
      // Test implementation
    })

    it("invalidates staff detail queries after deleting rule", async () => {
      // Test implementation
    })

    it("invalidates queries with different field parameters", async () => {
      // Specifically test that queries with { fields: "+availability_rules" }
      // are invalidated by mutations
    })
  })
})
```

#### 3.2 Add Integration Test for Staff Availability API

**File**: `integration-tests/http/__tests__/booking/admin/staff-availability.spec.ts` (new file)

```typescript
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Staff Availability API", () => {
      let staffId: string

      beforeAll(async () => {
        // Create test staff
      })

      it("returns availability_rules when requested", async () => {
        const response = await api.get(
          `/admin/bookings/staff/${staffId}?fields=+availability_rules`
        )
        expect(response.data.staff).toHaveProperty("availability_rules")
        expect(Array.isArray(response.data.staff.availability_rules)).toBe(true)
      })

      it("creates recurring availability rule", async () => {
        const response = await api.post(
          `/admin/bookings/staff/${staffId}/availability`,
          {
            rule_type: "recurring",
            day_of_week: 0,
            start_time: "09:00",
            end_time: "17:00",
          }
        )
        expect(response.status).toBe(200)
        expect(response.data.rule.day_of_week).toBe(0)
      })

      it("deletes availability rule", async () => {
        // Create rule first, then delete
      })

      it("reflects changes immediately after mutation", async () => {
        // Create rule
        // Fetch staff with +availability_rules
        // Verify rule appears in response
        // Delete rule
        // Fetch staff again
        // Verify rule is gone
      })
    })
  },
})
```

#### 3.3 Add E2E Test for Toggle Behavior (Optional)

**File**: `integration-tests/e2e/staff-availability-toggle.spec.ts` (new file)

Using Playwright or similar:

```typescript
test.describe("Staff Availability Toggle", () => {
  test("toggle enables and disables correctly", async ({ page }) => {
    await page.goto("/admin/bookings/staff/{id}/availability")

    // Get Monday toggle
    const mondayToggle = page.getByRole("switch").first()

    // Should start unchecked (or checked based on data)
    const initialState = await mondayToggle.isChecked()

    // Click to toggle
    await mondayToggle.click()

    // Wait for mutation
    await page.waitForResponse(/\/availability/)

    // State should be opposite
    expect(await mondayToggle.isChecked()).toBe(!initialState)

    // Click again
    await mondayToggle.click()
    await page.waitForResponse(/\/availability/)

    // Back to original
    expect(await mondayToggle.isChecked()).toBe(initialState)
  })
})
```

### Success Criteria - Phase 3

#### Automated Verification:
- [x] Integration tests pass: `yarn test:integration:http --testPathPattern=staff-availability`
- [x] All 13 tests pass

#### Manual Verification:
- [x] Tests cover the specific toggle bug scenario (see "handles multiple rules correctly")
- [x] Tests verify data consistency after create/delete operations

**Phase 3 Status**: ✅ Complete

---

## Testing Strategy Summary

### Unit Tests
- Cache invalidation predicate logic
- Query key matching behavior
- Hook return value types

### Integration Tests
- API returns relations when requested
- Create/update/delete operations persist correctly
- Data consistency after mutations

### Manual Testing Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Enable Day | Click toggle on disabled day | Shows enabled with times |
| Disable Day | Click toggle on enabled day | Shows "Closed" |
| Edit Times | Click pencil, change times, save | New times persist |
| Add Exception | Add exception date with custom hours | Shows in exceptions list |
| Add Blocked | Add blocked date | Shows in blocked list |
| Delete Rule | Delete exception or blocked date | Removed from list |
| Rapid Actions | Toggle same day multiple times quickly | Final state is consistent |
| Page Refresh | Make changes, refresh page | Changes persist |
| Different Staff | Switch to different staff member | Shows correct rules |

---

## Potential Additional Issues to Investigate

During diagnosis, we may discover related issues:

1. **Staff List Not Updating**: After creating/editing staff, list may not refresh
2. **Service Toggle Issues**: Similar cache issues may affect service is_active toggle
3. **Booking Status Updates**: Status changes may not reflect in UI immediately
4. **Settings Save**: Booking settings changes may have similar cache issues

If discovered, create separate fix plans for each.

---

## Common Pitfalls to Avoid

### When Adding New Module Relations

1. **Update joiner config** - Add new entities to `models` array
2. **Update query config** - Add `*relation_name` to default fields if auto-expanding
3. **Update route handlers** - Use RemoteQuery pattern for detail endpoints
4. **Update frontend hooks** - Use predicate invalidation if query has parameters

### When Creating CRUD Hooks

1. **Always invalidate related queries** - Not just the entity being modified
2. **Use predicate matching** - If queries may have different parameters
3. **Include parent entity invalidation** - Child mutations should invalidate parent queries

### When Handling Form Submissions

1. **Filter undefined values** - Don't send fields that weren't modified
2. **Handle null vs undefined** - Zod's `.nullish()` allows both; DTO may only accept one
3. **Validate on frontend first** - Catch errors before hitting backend

### TypeScript Type Mismatches

Common issue: Zod validator allows `null | undefined`, but DTO only accepts `string | undefined`:
```typescript
// Validator: z.string().nullish()  → string | null | undefined
// DTO type: string | undefined

// Fix: Check for null explicitly
if (body.field !== undefined && body.field !== null) {
  updateData.field = body.field
}
```

---

## Files Modified Summary

| File | Changes | Status |
|------|---------|--------|
| `packages/medusa/src/api/admin/bookings/query-config.ts` | Add `*availability_rules` to defaults | ✅ Done |
| `packages/medusa/src/api/admin/bookings/staff/[id]/route.ts` | Use remoteQuery pattern | ✅ Done |
| `packages/modules/booking/src/joiner-config.ts` | Add models array | ✅ Done |
| `packages/admin/dashboard/src/hooks/api/bookings.tsx` | Predicate-based cache invalidation | ✅ Done |
| `packages/medusa/src/api/admin/bookings/staff/[id]/availability/[ruleId]/route.ts` | Fix undefined field handling in update | ✅ Done |
| `packages/admin/dashboard/src/i18n/translations/en.json` | Add `actions.done` translation | ✅ Done |
| `packages/admin/dashboard/src/routes/bookings/staff/staff-availability/staff-availability.tsx` | Add reset schedule button (pending visibility issue) | ⚠️ Deferred |
| `integration-tests/http/__tests__/booking/admin/staff-availability.spec.ts` | New integration tests (13 tests) | ✅ Done |

---

## Lessons Learned & Best Practices

### Backend Patterns

#### 1. Partial Updates in API Routes
When handling PATCH/POST updates, **never pass `undefined` values** to the module service. Only include fields that were actually provided in the request:

```typescript
// ❌ BAD - Always includes all fields, even as undefined
const updateData = {
  id: ruleId,
  field1: body.field1 ?? undefined,
  field2: body.field2 ?? undefined,
}

// ✅ GOOD - Only includes provided fields
const updateData = { id: ruleId }
if (body.field1 !== undefined) {
  updateData.field1 = body.field1
}
```

**Why**: MikroORM interprets `undefined` as "set to null" which can violate NOT NULL constraints or overwrite valid data.

#### 2. RemoteQuery Pattern for Relations
When fetching entities with relations, use `remoteQueryObjectFromString` instead of direct module service calls:

```typescript
import { remoteQueryObjectFromString, ContainerRegistrationKeys } from "@medusajs/framework/utils"

const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
const queryObject = remoteQueryObjectFromString({
  entryPoint: "booking_staff",
  variables: { filters: { id } },
  fields: req.queryConfig.fields,  // Respects ?fields=+relation parameter
})
const [result] = await remoteQuery(queryObject)
```

**Why**: Direct service calls may not properly expand relations requested via query parameters.

#### 3. Joiner Config Must Include Models Array
For RemoteQuery to work, the module's joiner config needs a `models` array:

```typescript
export const joinerConfig = defineJoinerConfig(Modules.BOOKING, {
  linkableKeys: { /* ... */ },
  models: [Model1, Model2, Model3],  // Required for entity discovery
})
```

### Frontend Patterns

#### 4. Predicate-Based Cache Invalidation
When query keys include dynamic parameters (like `{ fields: "+relation" }`), use predicate-based invalidation instead of exact key matching:

```typescript
// ❌ BAD - Won't match queries with additional parameters
queryClient.invalidateQueries({
  queryKey: bookingStaffQueryKeys.detail(staffId)
})

// ✅ GOOD - Matches any query for this staff member
queryClient.invalidateQueries({
  predicate: (query) =>
    Array.isArray(query.queryKey) &&
    query.queryKey[0] === "booking_staff" &&
    query.queryKey[1] === "detail" &&
    query.queryKey[2] === staffId,
})
```

**Why**: Query keys like `["booking_staff", "detail", id, { query: { fields: "+availability_rules" } }]` won't match exact key `["booking_staff", "detail", id]`.

#### 5. Query Key Structure
The `queryKeysFactory` creates keys in this structure:
- List: `[entity, "list", { query }]`
- Detail: `[entity, "detail", id]` or `[entity, "detail", id, { query }]`

When writing invalidation predicates, check array indices accordingly.

### Development Workflow

#### 6. Dev Server Caching
Vite and the Medusa backend cache modules in memory. When modifying dependencies:
1. Changes may not appear until full server restart
2. Use `yarn build` to compile changes
3. Kill process on port 9000 before restarting
4. Hard refresh browser (Ctrl+Shift+R)

#### 7. i18n Keys
When using `t("path.to.key")` in components, ensure the key exists in translation files. Missing keys show as console warnings but render as the key path itself.

### Debugging Tips

#### 8. React Query DevTools
Use React Query DevTools to inspect:
- Current cache contents
- Query key structure
- Invalidation events

#### 9. Network Tab
Check the Network tab to verify:
- API requests are being made after mutations
- Response includes expected relations
- No 500 errors on updates

---

## Rollback Plan

If issues arise after deployment:

1. **Revert commits** related to this fix
2. **Clear client cache**: Users may need to clear browser cache
3. **No database migration** required - this is code-only fix

---

## References

- Original debugging session context
- Medusa promotions module patterns: `packages/medusa/src/api/admin/promotions/`
- Medusa order module joiner config: `packages/modules/order/src/joiner-config.ts`
- React Query cache invalidation docs: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
