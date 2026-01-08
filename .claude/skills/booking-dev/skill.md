---
name: booking-dev
description: Debug and implement the booking extension across backend module, APIs, workflows, admin UI, and storefront. Covers availability logic, API errors, UI issues, and end-to-end flow debugging.
allowed-tools: Bash, Read, Grep, Glob, TodoWrite, Task
---

# Booking Extension Development & Debugging

This skill provides comprehensive context for debugging and implementing the booking extension across the full stack.

## Quick Start

When debugging a booking issue:
1. **Identify the layer** - Is it backend module, API, workflow, admin UI, or storefront?
2. **Read the relevant files** listed in the Architecture Reference below
3. **Check the Debugging Guide** for common patterns
4. **Run tests** to verify fixes

## Architecture Reference

### Backend Module (`packages/modules/booking/src/`)

| Component | File | Purpose |
|-----------|------|---------|
| **Models** | | |
| BookingRecord | `models/booking.ts` | Main booking entity (status, times, payment, customer info) |
| BookingService | `models/service.ts` | Service offerings (duration, price, deposits) |
| BookingStaff | `models/staff.ts` | Staff members |
| BookingAvailabilityRule | `models/availability-rule.ts` | RECURRING/EXCEPTION/BLOCKED rules |
| BookingSettings | `models/booking-settings.ts` | Singleton system settings |
| **Service** | | |
| BookingModuleService | `services/booking-module-service.ts` | Main service with `getAvailableSlots()`, `checkSlotAvailability()` |
| **Utilities** | | |
| Availability Utils | `utils/availability.ts` | Date/time parsing, rule evaluation (23 functions) |
| **Config** | | |
| Joiner Config | `joiner-config.ts` | Module linking keys |
| **Types** | `types/` | DTOs for all entities |
| **Migrations** | `migrations/Migration20260105000000.ts` | Database schema |

### API Routes (`packages/medusa/src/api/`)

#### Admin Routes (`admin/bookings/`)

| Endpoint | File | Methods |
|----------|------|---------|
| `/admin/bookings` | `route.ts` | GET (list), POST (create) |
| `/admin/bookings/:id` | `[id]/route.ts` | GET, POST (update), DELETE |
| `/admin/bookings/services` | `services/route.ts` | GET, POST |
| `/admin/bookings/services/:id` | `services/[id]/route.ts` | GET, POST, DELETE |
| `/admin/bookings/staff` | `staff/route.ts` | GET, POST |
| `/admin/bookings/staff/:id` | `staff/[id]/route.ts` | GET, POST, DELETE |
| `/admin/bookings/staff/:id/availability` | `staff/[id]/availability/route.ts` | GET, POST |
| `/admin/bookings/staff/:id/availability/:ruleId` | `staff/[id]/availability/[ruleId]/route.ts` | GET, POST, DELETE |
| `/admin/bookings/settings` | `settings/route.ts` | GET, POST |

**Supporting Files:**
- `validators.ts` - Zod schemas for all admin endpoints
- `query-config.ts` - Default fields and pagination
- `middlewares.ts` - Route middleware

#### Store Routes (`store/bookings/`)

| Endpoint | File | Methods | Auth |
|----------|------|---------|------|
| `/store/bookings` | `route.ts` | POST (hold slot), GET (customer bookings) | No/Yes |
| `/store/bookings/:id` | `[id]/route.ts` | GET | No |
| `/store/bookings/:id/confirm` | `[id]/confirm/route.ts` | POST | No |
| `/store/bookings/:id/cancel` | `[id]/cancel/route.ts` | POST | No |
| `/store/bookings/services` | `services/route.ts` | GET | No |
| `/store/bookings/availability` | `availability/route.ts` | GET | No |

**Supporting Files:**
- `validators.ts` - Zod schemas for store endpoints
- `query-config.ts` - Default fields
- `middlewares.ts` - Route middleware

### Workflows (`packages/core/core-flows/src/booking/`)

| Workflow | File | Purpose |
|----------|------|---------|
| hold-booking-slot | `workflows/hold-booking-slot.ts` | Create 10-min hold on slot |
| confirm-booking | `workflows/confirm-booking.ts` | Confirm or create payment cart |
| cancel-booking | `workflows/cancel-booking.ts` | Cancel with optional refund |

**Steps** (`steps/`):
| Step | File | Purpose |
|------|------|---------|
| create-booking | `create-booking.ts` | Create booking record (with compensation) |
| validate-slot-availability | `validate-slot-availability.ts` | Check slot is available |
| create-booking-cart | `create-booking-cart.ts` | Create cart for payment |
| update-booking | `update-booking.ts` | Update booking fields |
| validate-booking-for-confirmation | `validate-booking-for-confirmation.ts` | Validate HELD status |
| validate-cancellation-window | `validate-cancellation-window.ts` | Check cancellation window |

### Core Types (`packages/core/types/src/booking/`)

- `common.ts` - Shared types and enums
- `mutations.ts` - Create/Update DTOs
- `service.ts` - IBookingModuleService interface
- `workflow.ts` - Workflow input/output types

### Admin Dashboard (`packages/admin/dashboard/src/`)

#### API Hooks
- `hooks/api/bookings.tsx` - All React Query hooks (824 lines)

#### Table Hooks
- `hooks/table/columns/use-booking-table-columns.tsx`
- `hooks/table/columns/use-service-table-columns.tsx`
- `hooks/table/filters/use-booking-table-filters.tsx`
- `hooks/table/query/use-booking-table-query.tsx`

#### Routes (`routes/bookings/`)

| Section | Routes |
|---------|--------|
| Bookings | `booking-list/`, `booking-create/`, `booking-detail/`, `booking-edit/` |
| Services | `services/service-list/`, `services/service-create/`, `services/service-detail/`, `services/service-edit/` |
| Staff | `staff/staff-list/`, `staff/staff-create/`, `staff/staff-detail/`, `staff/staff-edit/`, `staff/staff-availability/` |
| Settings | `settings/booking-settings.tsx` |

#### i18n Keys
All booking translations are in `i18n/translations/en.json` under:
- `bookings.*` - Main booking keys
- `bookings.staff.*` - Staff-related keys
- `bookings.services.*` - Service-related keys
- `bookings.settings.*` - Settings keys

### Storefront (External Repo)

**Path**: `C:\Users\newpc\Desktop\I want to back up\Coding Repos\Github Repos\medusastore\my-medusa-storefront`

| Component | File |
|-----------|------|
| **Pages** | |
| Booking Page | `src/app/[countryCode]/(main)/book/page.tsx` |
| Services Page | `src/app/[countryCode]/(main)/services/page.tsx` |
| **Components** (`src/modules/booking/`) | |
| Booking Flow | `templates/booking-flow/index.tsx` |
| Service Selection | `components/service-selection/index.tsx` |
| Appointment Picker | `components/appointment-picker/index.tsx` |
| Booking Summary | `components/booking-summary/index.tsx` |
| Appointment Review | `components/appointment-review/index.tsx` |
| Appointment Confirmation | `components/appointment-confirmation/index.tsx` |
| Barber Hero | `components/barber-hero/index.tsx` |
| **Data Layer** (`src/lib/data/`) | |
| API Functions | `booking.ts` |
| Utilities | `booking-utils.ts` |
| **Cart Integration** | |
| Checkout Form | `src/modules/checkout/templates/checkout-form/index.tsx` |
| Cart Item | `src/modules/cart/components/item/index.tsx` |

---

## Debugging Guide

### 1. Availability Logic Issues

**Key Files to Read:**
- `packages/modules/booking/src/services/booking-module-service.ts` - `getAvailableSlots()` method
- `packages/modules/booking/src/utils/availability.ts` - All helper functions

**Rule Priority (highest to lowest):**
1. BLOCKED - Blocks the entire day
2. EXCEPTION - Specific date overrides
3. RECURRING - Weekly patterns (Mon=0, Sun=6)

**Slot Generation Logic:**
```
1. Get service duration + buffer
2. Get staff's availability rules for the date
3. Apply findApplicableRule() priority
4. Generate 15-minute slot boundaries
5. Filter out conflicting bookings (HELD or CONFIRMED status)
6. Return available slots
```

**Common Issues:**
- **Wrong timezone**: All times are UTC in API. Use `ensureDate()` for proper parsing.
- **Off-boundary times**: Slots must be on 15-minute boundaries. Check `isOnSlotBoundary()`.
- **Past times**: Use `isInPast()` to validate.
- **Day of week mismatch**: `getDayOfWeek()` returns 0=Monday, 6=Sunday (not JS default).

**Debug Commands:**
```bash
# Test availability utils
cd packages/modules/booking && yarn test src/__tests__/availability-utils.spec.ts

# Check specific rule evaluation
grep -n "findApplicableRule" packages/modules/booking/src/
```

### 2. API/Workflow Errors

**Workflow Execution Flow:**
```
Store POST /bookings → holdBookingSlotWorkflow
  ├─ validateSlotAvailabilityStep (throws if unavailable)
  ├─ createBookingStep (creates HELD booking)
  ├─ createRemoteLinkStep (if customer_id provided)
  └─ Hook: bookingHeld

Store POST /bookings/:id/confirm → confirmBookingWorkflow
  ├─ validateBookingForConfirmationStep (throws if not HELD or expired)
  ├─ Branch A (pay_in_store): updateBookingStep → CONFIRMED
  └─ Branch B (deposit/full): createBookingCartStep → returns cart_id

Store POST /bookings/:id/cancel → cancelBookingWorkflow
  ├─ validateCancellationWindowStep (admin bypasses)
  ├─ cancelOrderWorkflow (if order exists)
  └─ updateBookingStep → CANCELLED
```

**Common Error Types:**
- `MedusaError.Types.NOT_FOUND` - Resource doesn't exist
- `MedusaError.Types.NOT_ALLOWED` - Invalid state or window violation
- `MedusaError.Types.INVALID_DATA` - Validation failures

**Debug Steps:**
1. Check validators in `validators.ts` for request format
2. Read the workflow file to understand step order
3. Check compensation functions for rollback behavior
4. Look for `throw new MedusaError()` to find error conditions

### 3. Admin UI Issues

**React Query Patterns:**
- Query keys follow pattern: `bookingQueryKeys.*`
- Mutations invalidate related queries automatically
- Cache stale time: 60 seconds for lists

**Form Validation:**
- All forms use Zod schemas
- Check `z.object({...})` definitions in route files
- Form errors show via `form.formState.errors`

**Common Issues:**
- **Stale data**: Clear React Query cache or check invalidation in mutation's `onSuccess`
- **Missing translations**: Check `en.json` for `bookings.*` keys
- **Component not updating**: Check if using `useQuery` with correct dependencies

**Debug Commands:**
```bash
# Find all booking-related hooks
grep -rn "useBooking" packages/admin/dashboard/src/

# Check translation keys
grep -n "bookings\." packages/admin/dashboard/src/i18n/translations/en.json
```

### 3a. Admin UI Price Display Issues

**Symptom**: Prices show as $3500 instead of $35 (100x too high)

**Root Causes:**
1. Missing `/100` division in display code
2. BigNumber returning object format not handled
3. **Cached code being served** - most common!

**Debugging Steps:**
1. **Add console.log** to `formatCurrency()` in the affected file:
   ```typescript
   console.log("formatCurrency input:", { amount, type: typeof amount })
   ```
2. **Check browser DevTools Console** for the log output
3. If logs don't appear → **cached code is running, need full restart**

**Cache Issue Resolution:**
The admin dashboard is served by the Medusa backend. Vite caches modules in memory. After code changes:
1. **Kill the process on port 9000** (CRITICAL):
   ```bash
   netstat -ano | findstr :9000  # Find PID
   taskkill //F //PID <pid>       # Kill it
   ```
2. **Rebuild**: `yarn build` or `yarn workspace @medusajs/dashboard build`
3. **Restart dev server**: `cd dev && npm run dev`
4. **Hard refresh browser**: Ctrl+Shift+R

Or simply run `/test-local` skill which does all of this.

### 4. End-to-End Flow Issues

**Booking Lifecycle:**
```
HELD (10 min expiry)
  │
  ├─ confirm (pay_in_store) → CONFIRMED
  │                               │
  │                               ├─ complete → COMPLETED
  │                               └─ no_show → NO_SHOW
  │
  ├─ confirm (deposit/full) → Cart created → Payment → CONFIRMED
  │
  └─ cancel/expire → CANCELLED
```

**Payment Mode Logic:**
- `pay_in_store`: Booking confirmed immediately, no cart
- `deposit`: Cart created with deposit amount (fixed or percent)
- `full`: Cart created with full service price

**Customer Linking:**
- If `customer_id` provided, booking links via RemoteLink
- Guest bookings have `customer_id: null` but store `customer_email`, `customer_name`, `customer_phone`

**Storefront Flow:**
1. User selects service → fetches availability
2. User picks slot → POST /store/bookings (creates HELD)
3. User confirms → POST /store/bookings/:id/confirm
4. If pay_in_store: Done. If deposit/full: Redirect to cart/checkout

---

## Test Commands

### Module Unit Tests
```bash
# All booking module tests
cd packages/modules/booking && yarn test

# Specific test file
cd packages/modules/booking && yarn test src/__tests__/availability-utils.spec.ts
```

### Module Integration Tests
```bash
# Full integration test suite
cd packages/modules/booking && yarn test:integration

# Or with explicit DB config
DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=postgres \
  npx jest packages/modules/booking/integration-tests/__tests__/booking-module-service.spec.ts
```

### HTTP Integration Tests (if available)
```bash
# Run booking HTTP tests
DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=postgres \
  yarn test:integration:http --testPathPattern="booking"
```

---

## Common Patterns & Gotchas

### Timezone Handling
- **API**: All `start_at`, `end_at`, timestamps are UTC (ISO 8601)
- **Display**: Convert to local timezone in UI
- **Date-only queries**: Use "YYYY-MM-DD" format, handled by `ensureDate()`

### Price Storage & Display

**Storage Format:**
- **Backend**: Prices stored in cents using `model.bigNumber()` (e.g., 3500 = $35.00)
- **Database**: BigNumber serializes as integer in cents

**API Response Formats (BigNumber can return multiple formats):**
```typescript
// Possible formats from API:
price: 3500           // Plain number
price: "3500"         // String
price: {value: "3500"} // BigNumber object format
```

**Safe Price Extraction Helper:**
```typescript
const extractPriceValue = (price: unknown): number => {
  if (price === null || price === undefined) return 0
  // Handle BigNumber object format {value: "3500"}
  if (typeof price === "object" && price !== null && "value" in price) {
    return parseFloat(String((price as { value: unknown }).value))
  }
  return typeof price === "string" ? parseFloat(price) : Number(price)
}
```

**Admin UI Price Display Files:**
| File | Purpose |
|------|---------|
| `hooks/table/columns/use-service-table-columns.tsx` | Service list table - `formatCurrency()` |
| `routes/bookings/services/service-detail/service-detail.tsx` | Service detail page - inline display |
| `routes/bookings/booking-detail/components/booking-payment-section/booking-payment-section.tsx` | Booking payment info - `formatCurrency()` |

**Form Input/Output Conversion:**
- **Create/Edit forms**: User enters dollars (35.00) → multiply by 100 → send 3500 to API
- **Display**: Receive 3500 from API → divide by 100 → show $35.00

**Storefront**: Same conversion pattern in `src/lib/data/booking-utils.ts`

### Status Enum Values
```typescript
enum BookingStatus {
  HELD = "held",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  NO_SHOW = "no_show"
}
```

### Rule Type Enum Values
```typescript
enum RuleType {
  RECURRING = "recurring",   // Weekly schedule
  EXCEPTION = "exception",   // Specific date override
  BLOCKED = "blocked"        // Day off
}
```

### Day of Week Enum
```typescript
enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6
}
```
**Note**: This differs from JavaScript's `Date.getDay()` which uses 0=Sunday!

---

## Quick File Lookup

When you need to find something specific:

```bash
# Find all booking-related files
find packages -name "*booking*" -type f

# Search for specific function
grep -rn "getAvailableSlots" packages/

# Find all booking API routes
ls -la packages/medusa/src/api/admin/bookings/
ls -la packages/medusa/src/api/store/bookings/

# Find all booking workflows
ls -la packages/core/core-flows/src/booking/

# Check storefront booking code
ls -la "C:/Users/newpc/Desktop/I want to back up/Coding Repos/Github Repos/medusastore/my-medusa-storefront/src/modules/booking/"
```

---

## Debugging Checklist

When debugging a booking issue:

- [ ] Identify which layer has the bug (module/API/workflow/UI/storefront)
- [ ] Read the relevant source files
- [ ] Check if there are related tests
- [ ] Verify timezone handling if time-related
- [ ] Check enum values match (especially DayOfWeek)
- [ ] Verify price conversion (cents vs dollars)
- [ ] Run relevant tests after fix
- [ ] Test end-to-end flow if workflow modified

**For price display issues specifically:**
- [ ] Add console.log to see actual values at runtime
- [ ] Kill port 9000, rebuild, restart dev server (or run /test-local)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for debug output
- [ ] Verify `extractPriceValue()` handles BigNumber object format

---

## Lessons Learned

### Price Display Bug Investigation (Jan 2026)

**Symptom**: Prices show 100x too high (e.g., $3,200 instead of $32)
- User enters price in dollars (e.g., 32.00) in admin form
- Form correctly multiplies by 100 → stored as 3200 cents in DB
- Display pages missing `/100` division → show $3,200.00 instead of $32.00

**Pages affected:**
| Page | File | Has /100 fix? | Has [v2] marker? |
|------|------|---------------|------------------|
| Service LIST | `use-service-table-columns.tsx` | YES | YES |
| Service DETAIL | `service-detail.tsx` | YES | YES |
| Booking DETAIL | `booking-payment-section.tsx` | YES | YES |

**CRITICAL: Browser Caching Issue**
All files have the `/100` fix AND `[v2]` visual markers added. However, the browser aggressively caches JavaScript chunks even after rebuilding. If you don't see `[v2]` prefix on prices, the old cached code is running.

**To verify new code is running:**
1. Look for `[v2]` prefix on any price display (e.g., "[v2] $32.00")
2. If no `[v2]` prefix appears, the browser is serving cached JS

**To force fresh code:**
1. Kill port 9000: `netstat -ano | findstr :9000` then `taskkill //F //PID <pid>`
2. Rebuild: `yarn workspace @medusajs/dashboard build`
3. Restart: `cd dev && npm run dev`
4. Clear ALL browser data for localhost:9000 (not just cache)
5. Or use a completely different browser that hasn't visited the site

**Debug Strategy:**
1. First check if `[v2]` prefix appears - if not, it's a caching issue
2. Check JSON tab in admin to see raw API response values
3. Use `/test-local` skill for full restart
4. If caching persists across browsers, check if Medusa backend is setting aggressive cache-control headers on static files

**Files with price display logic:**
- `use-service-table-columns.tsx` - Service LIST table (formatCurrency with /100)
- `service-detail.tsx` - Service DETAIL page (extractPriceValue + /100)
- `booking-payment-section.tsx` - Booking DETAIL payment section (formatCurrency with /100)
- `create-service-form.tsx` - Service CREATE form (multiplies by 100 on submit)
- `service-edit.tsx` - Service EDIT form (divides by 100 on load, multiplies on save)

**When fix is confirmed working (user sees [v2] prefix and correct prices):**
Remove all `[v2]` markers from formatCurrency functions in:
- `use-service-table-columns.tsx` (line 37)
- `service-detail.tsx` (line 173)
- `booking-payment-section.tsx` (line 37)
Also remove red debug box from `service-detail.tsx` (lines 158-164)
