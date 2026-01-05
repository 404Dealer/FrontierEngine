# Medusa v2 Booking System Implementation Plan

## Best Practices: Always Reference Official Documentation

> **CRITICAL**: Before implementing any feature, always consult the latest Medusa v2 documentation to ensure patterns are current and best practices are followed.

### Official Documentation Resources

| Topic | URL | When to Reference |
|-------|-----|-------------------|
| **Modules** | https://docs.medusajs.com/learn/fundamentals/modules | Before creating any module |
| **Data Models (DML)** | https://docs.medusajs.com/learn/fundamentals/data-models | Before defining any model |
| **Module Links** | https://docs.medusajs.com/learn/fundamentals/module-links | Before creating cross-module relationships |
| **Workflows** | https://docs.medusajs.com/learn/fundamentals/workflows | Before creating any workflow |
| **API Routes** | https://docs.medusajs.com/learn/fundamentals/api-routes | Before creating any endpoint |
| **Admin Extensions** | https://docs.medusajs.com/learn/fundamentals/admin/widgets | Before building admin UI |
| **Scheduled Jobs** | https://docs.medusajs.com/learn/fundamentals/scheduled-jobs | Before creating background jobs |
| **Testing** | https://docs.medusajs.com/learn/debugging-and-testing/testing-tools | Before writing tests |

### Documentation Verification Checklist

Before implementing each milestone, verify:

- [ ] Check if API has changed since this plan was written
- [ ] Review any new patterns or deprecations in release notes
- [ ] Cross-reference with official examples in `medusajs/examples` repo
- [ ] Consult ticket-booking recipe: https://docs.medusajs.com/resources/recipes/ticket-booking

### Key Documentation to Bookmark

1. **Medusa v2 Learn**: https://docs.medusajs.com/learn
2. **API Reference**: https://docs.medusajs.com/api
3. **Recipes**: https://docs.medusajs.com/resources/recipes
4. **GitHub Examples**: https://github.com/medusajs/examples

---

## Validation Summary

After analyzing the Medusa v2 codebase, the architecture recommendations are **CORRECT and validated**:

| Recommendation | Validated | Evidence |
|----------------|-----------|----------|
| Custom module for appointments | ✅ | `packages/modules/order/`, `packages/modules/product/` patterns |
| Module links for cross-module relationships | ✅ | `defineLink()` in `packages/core/utils/src/modules-sdk/define-link.ts` |
| Workflows for business logic | ✅ | `packages/core/core-flows/` with `createStep()` + `createWorkflow()` |
| Manual payment provider for "pay in store" | ✅ | `SystemPaymentProvider` at `packages/modules/payment/src/providers/system.ts` |
| Admin UI extensions (routes + widgets) | ✅ | `packages/admin/admin-sdk/` with `defineWidgetConfig()`, `defineRouteConfig()` |
| Ticket booking recipe exists | ✅ | `www/apps/resources/app/recipes/ticket-booking/` |

The "system" payment provider automatically returns `AUTHORIZED` status - perfect for pay-in-store scenarios.

---

## Architecture Decision: Fixed Slots vs Duration-Based

**Decision: Fixed 15-minute increments** ✅ CONFIRMED

**Rationale:**
1. Simpler conflict detection (slot as unique key)
2. Services can span multiple slots (30min = 2 slots, 45min = 3 slots)
3. Buffer time between appointments is easier to manage
4. Future migration to duration-based is possible

**Implementation Details:**
- All bookings start at :00, :15, :30, or :45
- A 30-minute service occupies 2 consecutive 15-min slots
- A 45-minute service occupies 3 consecutive 15-min slots
- Buffer time is added after the service duration

**Conflict Prevention Strategy:**
- Unique index on `(staff_id, start_at)` for held/confirmed bookings
- Status check: only `held` or `confirmed` bookings block slots
- Atomic transaction with `SELECT ... FOR UPDATE` for slot reservation
- Race condition protection via database-level constraints

---

## Phase 1: Core Module Structure

### 1.1 Create Booking Module Directory

```
packages/modules/booking/
├── src/
│   ├── models/
│   │   ├── service.ts              # Barbershop service (haircut, beard, etc.)
│   │   ├── staff.ts                # Staff/barber
│   │   ├── availability-rule.ts    # Working hours & exceptions
│   │   ├── booking.ts              # The appointment
│   │   ├── booking-slot.ts         # Individual time slots (15-min blocks)
│   │   └── index.ts
│   ├── services/
│   │   ├── booking-module-service.ts
│   │   └── index.ts
│   ├── repositories/
│   │   ├── booking.ts
│   │   ├── service.ts
│   │   ├── staff.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── service.ts
│   │   ├── booking.ts
│   │   └── index.ts
│   ├── migrations/
│   ├── joiner-config.ts
│   └── index.ts
├── integration-tests/
├── package.json
├── tsconfig.json
└── jest.config.js
```

### 1.2 Data Models

#### Service Model (`models/service.ts`)

```typescript
import { model } from "@medusajs/framework/utils"

export enum DepositType {
  NONE = "none",
  FIXED = "fixed",
  PERCENT = "percent",
}

export enum PaymentModeAllowed {
  PAY_IN_STORE = "pay_in_store",
  DEPOSIT = "deposit",
  FULL = "full",
}

export const Service = model
  .define("booking_service", {
    id: model.id({ prefix: "bksvc" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    duration_minutes: model.number().default(30),
    buffer_minutes: model.number().default(0),
    price: model.bigNumber(),                    // Using bigNumber for currency
    currency_code: model.text().default("usd"),
    deposit_type: model.enum(DepositType).default(DepositType.NONE),
    deposit_value: model.bigNumber().nullable(), // Amount or percentage
    payment_modes_allowed: model.json().default(["pay_in_store"]), // Array of PaymentModeAllowed
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_booking_service_is_active",
      on: ["is_active"],
      where: "deleted_at IS NULL",
    },
  ])
```

#### Staff Model (`models/staff.ts`)

```typescript
import { model } from "@medusajs/framework/utils"
import { AvailabilityRule } from "./availability-rule"
import { Booking } from "./booking"

export const Staff = model
  .define("booking_staff", {
    id: model.id({ prefix: "bkstf" }).primaryKey(),
    name: model.text().searchable(),
    email: model.text().nullable(),
    phone: model.text().nullable(),
    bio: model.text().nullable(),
    avatar_url: model.text().nullable(),
    is_active: model.boolean().default(true),
    availability_rules: model.hasMany(() => AvailabilityRule, {
      mappedBy: "staff",
    }),
    bookings: model.hasMany(() => Booking, {
      mappedBy: "staff",
    }),
    metadata: model.json().nullable(),
  })
  .cascades({
    delete: ["availability_rules"],
  })
  .indexes([
    {
      name: "IDX_booking_staff_is_active",
      on: ["is_active"],
      where: "deleted_at IS NULL",
    },
  ])
```

#### AvailabilityRule Model (`models/availability-rule.ts`)

```typescript
import { model } from "@medusajs/framework/utils"
import { Staff } from "./staff"

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

export enum RuleType {
  RECURRING = "recurring",      // Weekly recurring schedule
  EXCEPTION = "exception",      // Override for specific date
  BLOCKED = "blocked",          // Time off / unavailable
}

export const AvailabilityRule = model
  .define("booking_availability_rule", {
    id: model.id({ prefix: "bkavl" }).primaryKey(),
    staff: model.belongsTo(() => Staff, {
      mappedBy: "availability_rules",
    }),
    rule_type: model.enum(RuleType).default(RuleType.RECURRING),
    day_of_week: model.number().nullable(),    // 0-6 for recurring rules
    specific_date: model.dateTime().nullable(), // For exceptions/blocked
    start_time: model.text(),                   // "09:00" format
    end_time: model.text(),                     // "17:00" format
    is_available: model.boolean().default(true), // false = blocked time
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_availability_staff_day",
      on: ["staff_id", "day_of_week"],
      where: "deleted_at IS NULL AND rule_type = 'recurring'",
    },
    {
      name: "IDX_availability_staff_date",
      on: ["staff_id", "specific_date"],
      where: "deleted_at IS NULL AND specific_date IS NOT NULL",
    },
  ])
```

#### Booking Model (`models/booking.ts`)

```typescript
import { model } from "@medusajs/framework/utils"
import { Staff } from "./staff"
import { Service } from "./service"

export enum BookingStatus {
  HELD = "held",           // Temporary hold during checkout
  CONFIRMED = "confirmed", // Payment completed or pay-in-store selected
  CANCELLED = "cancelled",
  COMPLETED = "completed", // Service delivered
  NO_SHOW = "no_show",
}

export enum PaymentMode {
  PAY_IN_STORE = "pay_in_store",
  DEPOSIT = "deposit",
  FULL = "full",
}

export const Booking = model
  .define("booking", {
    id: model.id({ prefix: "book" }).primaryKey(),
    display_id: model.autoincrement(),
    staff: model.belongsTo(() => Staff, {
      mappedBy: "bookings",
    }),
    service_id: model.text(),                    // Will link to Service
    customer_id: model.text().nullable(),        // Will link via module link

    // Time slot
    start_at: model.dateTime(),
    end_at: model.dateTime(),

    // Status
    status: model.enum(BookingStatus).default(BookingStatus.HELD),
    hold_expires_at: model.dateTime().nullable(),

    // Pricing snapshot (immutable after creation)
    service_name: model.text(),                  // Snapshot of service name
    price_amount: model.bigNumber(),
    currency_code: model.text(),
    deposit_amount: model.bigNumber().nullable(),

    // Payment tracking
    payment_mode: model.enum(PaymentMode).nullable(),
    amount_paid: model.bigNumber().nullable(),

    // Customer info (for guests)
    customer_email: model.text().nullable(),
    customer_phone: model.text().nullable(),
    customer_name: model.text().nullable(),

    // Notes
    notes: model.text().nullable(),
    internal_notes: model.text().nullable(),

    // Timestamps
    confirmed_at: model.dateTime().nullable(),
    cancelled_at: model.dateTime().nullable(),
    completed_at: model.dateTime().nullable(),

    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_booking_staff_start",
      on: ["staff_id", "start_at"],
      unique: true,
      where: "deleted_at IS NULL AND status IN ('held', 'confirmed')",
    },
    {
      name: "IDX_booking_status",
      on: ["status"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_booking_customer",
      on: ["customer_id"],
      where: "deleted_at IS NULL AND customer_id IS NOT NULL",
    },
    {
      name: "IDX_booking_hold_expires",
      on: ["hold_expires_at"],
      where: "deleted_at IS NULL AND status = 'held'",
    },
    {
      name: "IDX_booking_date_range",
      on: ["start_at", "end_at"],
      where: "deleted_at IS NULL",
    },
  ])
```

---

## Phase 2: Module Links

### 2.1 Booking ↔ Order Link

Create `src/links/booking-order.ts`:

```typescript
import { defineLink } from "@medusajs/framework/utils"
import BookingModule from "../modules/booking"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  BookingModule.linkable.booking,
  OrderModule.linkable.order
)
```

### 2.2 Booking ↔ Customer Link

Create `src/links/booking-customer.ts`:

```typescript
import { defineLink } from "@medusajs/framework/utils"
import BookingModule from "../modules/booking"
import CustomerModule from "@medusajs/medusa/customer"

export default defineLink(
  {
    linkable: BookingModule.linkable.booking,
    isList: true,
  },
  CustomerModule.linkable.customer
)
```

### 2.3 Service ↔ Product Link (Optional, for display in catalog)

Create `src/links/service-product.ts`:

```typescript
import { defineLink } from "@medusajs/framework/utils"
import BookingModule from "../modules/booking"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
  BookingModule.linkable.service,
  ProductModule.linkable.product
)
```

---

## Phase 3: Workflows

### 3.1 Hold Slot Workflow

`packages/core/core-flows/src/booking/workflows/hold-booking-slot.ts`:

```typescript
import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

// Step 1: Validate availability
export const validateSlotAvailabilityStep = createStep(
  "validate-slot-availability",
  async (input: { staff_id: string; start_at: Date; end_at: Date }, { container }) => {
    const bookingModule = container.resolve("bookingModuleService")

    // Check staff availability rules
    const isAvailable = await bookingModule.checkSlotAvailability(
      input.staff_id,
      input.start_at,
      input.end_at
    )

    if (!isAvailable) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Selected time slot is not available"
      )
    }

    return new StepResponse({ validated: true })
  }
)

// Step 2: Create held booking (atomic with conflict check)
export const createHeldBookingStep = createStep(
  "create-held-booking",
  async (input: {
    staff_id: string
    service_id: string
    start_at: Date
    end_at: Date
    customer_email?: string
    customer_phone?: string
    customer_name?: string
    hold_duration_minutes?: number
  }, { container }) => {
    const bookingModule = container.resolve("bookingModuleService")

    const holdExpires = new Date()
    holdExpires.setMinutes(
      holdExpires.getMinutes() + (input.hold_duration_minutes || 10)
    )

    // This method should use a transaction with SELECT FOR UPDATE
    // or a unique constraint to prevent race conditions
    const booking = await bookingModule.createBookingWithConflictCheck({
      ...input,
      status: "held",
      hold_expires_at: holdExpires,
    })

    return new StepResponse(booking, booking.id)
  },
  // Compensation: release the hold
  async (bookingId, { container }) => {
    if (!bookingId) return
    const bookingModule = container.resolve("bookingModuleService")
    await bookingModule.deleteBookings([bookingId])
  }
)

// Workflow
export const holdBookingSlotWorkflow = createWorkflow(
  "hold-booking-slot",
  (input: WorkflowData<{
    staff_id: string
    service_id: string
    start_at: Date
    customer_email?: string
    customer_phone?: string
    customer_name?: string
  }>) => {
    // Get service to calculate end_at
    const service = useQueryGraphStep({
      entity: "booking_service",
      fields: ["id", "duration_minutes", "buffer_minutes", "price", "name"],
      filters: { id: input.service_id },
    })

    const slotData = transform(
      { input, service },
      (data) => {
        const svc = data.service.data[0]
        const startAt = new Date(data.input.start_at)
        const endAt = new Date(startAt)
        endAt.setMinutes(endAt.getMinutes() + svc.duration_minutes + svc.buffer_minutes)

        return {
          ...data.input,
          end_at: endAt,
          service_name: svc.name,
          price_amount: svc.price,
        }
      }
    )

    validateSlotAvailabilityStep({
      staff_id: input.staff_id,
      start_at: slotData.start_at,
      end_at: slotData.end_at,
    })

    const booking = createHeldBookingStep(slotData)

    return new WorkflowResponse(booking)
  }
)
```

### 3.2 Confirm Booking Workflow (with payment)

```typescript
export const confirmBookingWorkflow = createWorkflow(
  "confirm-booking",
  (input: WorkflowData<{
    booking_id: string
    payment_mode: "pay_in_store" | "deposit" | "full"
  }>) => {
    // Validate booking exists and is held
    const booking = validateHeldBookingStep(input.booking_id)

    // Based on payment mode, create cart/order or just confirm
    const orderResult = when(
      { payment_mode: input.payment_mode },
      (data) => data.payment_mode !== "pay_in_store"
    ).then(() => {
      // Create cart with booking amount
      const cart = createBookingCartStep({
        booking_id: input.booking_id,
        payment_mode: input.payment_mode,
      })

      // Complete payment will be handled by store checkout flow
      return cart
    })

    // For pay_in_store, just confirm immediately
    const confirmedBooking = when(
      { payment_mode: input.payment_mode },
      (data) => data.payment_mode === "pay_in_store"
    ).then(() => {
      return confirmBookingStep({
        booking_id: input.booking_id,
        payment_mode: "pay_in_store",
      })
    })

    // Create module link between booking and order (if order created)
    when(
      { orderResult },
      (data) => !!data.orderResult
    ).then(() => {
      createBookingOrderLinkStep({
        booking_id: input.booking_id,
        order_id: orderResult.order_id,
      })
    })

    return new WorkflowResponse({ booking: confirmedBooking, cart: orderResult })
  }
)
```

### 3.3 Cancel Booking Workflow

```typescript
export const cancelBookingWorkflow = createWorkflow(
  "cancel-booking",
  (input: WorkflowData<{ booking_id: string; reason?: string }>) => {
    // Get booking with linked order
    const bookingWithOrder = useQueryGraphStep({
      entity: "booking",
      fields: ["*", "order.*"],
      filters: { id: input.booking_id },
    })

    // Cancel the booking
    const cancelledBooking = cancelBookingStep({
      booking_id: input.booking_id,
      reason: input.reason,
    })

    // If there's a linked order with payment, initiate refund
    when(
      { bookingWithOrder },
      (data) => !!data.bookingWithOrder.data[0]?.order?.id
    ).then(() => {
      // Use Medusa's refund workflow
      refundOrderWorkflow({
        order_id: bookingWithOrder.data[0].order.id,
      })
    })

    return new WorkflowResponse(cancelledBooking)
  }
)
```

---

## Phase 4: API Routes

### 4.1 Store Routes (Customer-facing)

```
src/api/store/bookings/
├── route.ts                    # GET (list my bookings), POST (hold slot)
├── [id]/
│   ├── route.ts               # GET (booking details)
│   ├── confirm/
│   │   └── route.ts           # POST (confirm with payment mode)
│   └── cancel/
│       └── route.ts           # POST (cancel booking)
├── services/
│   └── route.ts               # GET (list available services)
├── availability/
│   └── route.ts               # GET (available slots for date/staff)
├── middlewares.ts
└── validators.ts
```

#### Example: Hold Slot Route

`src/api/store/bookings/route.ts`:

```typescript
import { holdBookingSlotWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreHoldBookingType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreHoldBookingType>,
  res: MedusaResponse
) => {
  const { result } = await holdBookingSlotWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context?.actor_id,
    },
  })

  res.status(201).json({ booking: result })
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // List customer's bookings
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const bookingModule = req.scope.resolve("bookingModuleService")
  const bookings = await bookingModule.listBookings({
    customer_id: customerId,
  })

  res.json({ bookings })
}
```

#### Example: Availability Route

`src/api/store/bookings/availability/route.ts`:

```typescript
export const GET = async (
  req: MedusaRequest<{ date: string; staff_id?: string; service_id: string }>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve("bookingModuleService")

  const slots = await bookingModule.getAvailableSlots({
    date: new Date(req.validatedQuery.date),
    staff_id: req.validatedQuery.staff_id,
    service_id: req.validatedQuery.service_id,
  })

  res.json({ slots })
}
```

### 4.2 Admin Routes

```
src/api/admin/bookings/
├── route.ts                    # GET (list all), POST (create)
├── [id]/
│   ├── route.ts               # GET, POST (update), DELETE
│   ├── complete/
│   │   └── route.ts           # POST (mark as completed)
│   └── no-show/
│       └── route.ts           # POST (mark as no-show)
├── services/
│   ├── route.ts               # GET, POST
│   └── [id]/
│       └── route.ts           # GET, POST, DELETE
├── staff/
│   ├── route.ts               # GET, POST
│   └── [id]/
│       ├── route.ts           # GET, POST, DELETE
│       └── availability/
│           └── route.ts       # GET, POST (manage rules)
├── middlewares.ts
└── validators.ts
```

---

## Phase 5: Admin UI

### 5.1 Admin Route: Bookings Calendar

`src/admin/routes/bookings/page.tsx`:

```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Calendar } from "@medusajs/icons"

const BookingsPage = () => {
  // Calendar view component
  return (
    <Container>
      <Heading>Appointments</Heading>
      <BookingCalendar />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bookings",
  icon: Calendar,
})

export default BookingsPage
```

### 5.2 Admin Route: Services Management

`src/admin/routes/bookings/services/page.tsx`:

```tsx
const ServicesPage = () => {
  return (
    <Container>
      <Heading>Booking Services</Heading>
      <ServicesList />
      {/* Each service has deposit toggle, payment mode toggles */}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Services",
  nested: "/bookings",
})

export default ServicesPage
```

### 5.3 Widget: Order Detail - Booking Info

`src/admin/widgets/order-booking-widget.tsx`:

```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"

const OrderBookingWidget = ({ data }) => {
  const { data: booking } = useQuery({
    queryKey: ["booking-for-order", data.id],
    queryFn: () => fetchBookingForOrder(data.id),
  })

  if (!booking) return null

  return (
    <Container>
      <Heading level="h2">Appointment Details</Heading>
      <Text>Service: {booking.service_name}</Text>
      <Text>Date: {formatDate(booking.start_at)}</Text>
      <Text>Staff: {booking.staff.name}</Text>
      <StatusBadge status={booking.status} />
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderBookingWidget
```

### 5.4 Widget: Customer Detail - Upcoming Bookings

`src/admin/widgets/customer-bookings-widget.tsx`:

```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const CustomerBookingsWidget = ({ data }) => {
  const { data: bookings } = useQuery({
    queryKey: ["customer-bookings", data.id],
    queryFn: () => fetchCustomerBookings(data.id),
  })

  return (
    <Container>
      <Heading level="h2">Appointments</Heading>
      {bookings?.upcoming?.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default CustomerBookingsWidget
```

---

## Phase 6: Background Jobs

### 6.1 Expire Held Bookings

Create a scheduled job to clean up expired holds:

`src/jobs/expire-held-bookings.ts`:

```typescript
import { MedusaContainer } from "@medusajs/framework/types"

export default async function expireHeldBookings(container: MedusaContainer) {
  const bookingModule = container.resolve("bookingModuleService")

  // Find all held bookings where hold_expires_at < now
  const expiredHolds = await bookingModule.listBookings({
    status: "held",
    hold_expires_at: { $lt: new Date() },
  })

  if (expiredHolds.length > 0) {
    await bookingModule.deleteBookings(
      expiredHolds.map(b => b.id)
    )
    console.log(`Expired ${expiredHolds.length} held bookings`)
  }
}

export const config = {
  name: "expire-held-bookings",
  schedule: "*/5 * * * *", // Every 5 minutes
}
```

---

## Build Order (Implementation Sequence)

> **Note**: Each milestone has a **Verification Test** section. A milestone is only complete when ALL verification tests pass. Check off tests as they pass.

---

### Milestone 1: Foundation

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/modules
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/data-models

**Tasks:**
1. [ ] Create `packages/modules/booking/` directory structure
2. [ ] Implement data models (Service, Staff, AvailabilityRule, Booking)
3. [ ] Create `BookingModuleService` with basic CRUD
4. [ ] Generate and run migrations
5. [ ] Register module in `medusa-config.js`
6. [ ] Write unit tests for models

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M1-T1 | Module loads without errors | `yarn medusa start` (no crash) | [ ] Pass |
| M1-T2 | Migrations run successfully | `yarn medusa migrations run` | [ ] Pass |
| M1-T3 | Can create a Service via service | Unit test: `createServices([{name: "Haircut", duration_minutes: 30, price: 2500}])` returns service with ID | [ ] Pass |
| M1-T4 | Can create a Staff via service | Unit test: `createStaff([{name: "John"}])` returns staff with ID | [ ] Pass |
| M1-T5 | Can create a Booking via service | Unit test: `createBookings([{staff_id, service_id, start_at, end_at}])` returns booking with ID | [ ] Pass |
| M1-T6 | Service-Staff relationship works | Unit test: Create availability rule linked to staff, query staff with `availability_rules` included | [ ] Pass |
| M1-T7 | All unit tests pass | `yarn test packages/modules/booking` | [ ] Pass |

**Milestone 1 Completed:** [ ] _(Date: _________)_

---

### Milestone 2: Availability Logic

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/api-routes
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/modules (service methods)

**Tasks:**
1. [ ] Implement `getAvailableSlots()` method
2. [ ] Implement `checkSlotAvailability()` with conflict detection
3. [ ] Add availability rule management methods
4. [ ] Create store route: `GET /store/bookings/availability`
5. [ ] Create store route: `GET /store/bookings/services`
6. [ ] Write integration tests for availability

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M2-T1 | `GET /store/bookings/services` returns list of active services | `curl http://localhost:9000/store/bookings/services` returns `{services: [...]}` | [ ] Pass |
| M2-T2 | `GET /store/bookings/availability?date=YYYY-MM-DD&service_id=X` returns time slots | Returns `{slots: [{start_at, end_at, available: true/false}]}` | [ ] Pass |
| M2-T3 | Slots respect staff availability rules | Create rule: Mon 9AM-5PM. Query Monday → slots exist. Query Sunday → no slots | [ ] Pass |
| M2-T4 | Slots respect 15-minute increments | All returned slots start at :00, :15, :30, or :45 | [ ] Pass |
| M2-T5 | Blocked dates return no slots | Create BLOCKED rule for specific date. Query that date → no slots | [ ] Pass |
| M2-T6 | Service duration spans correct number of slots | 45min service shows slots that have 3 consecutive 15-min blocks available | [ ] Pass |
| M2-T7 | All integration tests pass | `yarn test:integration:http -- --grep "bookings/availability"` | [ ] Pass |

**Milestone 2 Completed:** [ ] _(Date: _________)_

---

### Milestone 3: Booking Workflows

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/workflows
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/scheduled-jobs

**Tasks:**
1. [ ] Implement `holdBookingSlotWorkflow`
2. [ ] Create store route: `POST /store/bookings` (hold)
3. [ ] Implement `confirmBookingWorkflow` for pay-in-store
4. [ ] Create store route: `POST /store/bookings/:id/confirm`
5. [ ] Create background job for expiring holds
6. [ ] Write integration tests for booking flow

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M3-T1 | `POST /store/bookings` creates held booking | Response includes `{booking: {id, status: "held", hold_expires_at}}` | [ ] Pass |
| M3-T2 | Held booking blocks that time slot | After hold, `GET /availability` shows slot as unavailable | [ ] Pass |
| M3-T3 | Concurrent booking requests prevent double-booking | Fire 2 simultaneous POSTs for same slot → only 1 succeeds, 1 fails with error | [ ] Pass |
| M3-T4 | `POST /store/bookings/:id/confirm` with pay_in_store confirms booking | Booking status changes to "confirmed", `confirmed_at` is set | [ ] Pass |
| M3-T5 | Held booking expires after timeout | Create hold, wait 11 minutes (or mock time), booking is deleted | [ ] Pass |
| M3-T6 | Expired hold releases the slot | After expiry, slot shows as available again | [ ] Pass |
| M3-T7 | Workflow compensation works | Force failure after hold creation → booking is rolled back | [ ] Pass |
| M3-T8 | All integration tests pass | `yarn test:integration:http -- --grep "bookings"` | [ ] Pass |

**Milestone 3 Completed:** [ ] _(Date: _________)_

---

### Milestone 4: Payment Integration

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/module-links
- [ ] Read: https://docs.medusajs.com/resources/commerce-modules/payment
- [ ] Read: https://docs.medusajs.com/resources/commerce-modules/cart

**Tasks:**
1. [ ] Implement cart creation for deposit/full payment
2. [ ] Define `Booking ↔ Order` module link
3. [ ] Connect to Medusa checkout flow
4. [ ] Implement `cancelBookingWorkflow` with refund
5. [ ] Write integration tests for payment flow

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M4-T1 | Confirm with `payment_mode: "deposit"` creates cart with deposit amount | Cart line item amount = service deposit value | [ ] Pass |
| M4-T2 | Confirm with `payment_mode: "full"` creates cart with full price | Cart line item amount = service full price | [ ] Pass |
| M4-T3 | Completing checkout confirms the booking | After order placed, booking status = "confirmed" | [ ] Pass |
| M4-T4 | Booking ↔ Order link is created | Query booking with `order.*` returns linked order | [ ] Pass |
| M4-T5 | Query order with booking info works | Query order → can access linked booking via query graph | [ ] Pass |
| M4-T6 | Cancel booking triggers refund workflow | Cancel confirmed booking with payment → refund is initiated | [ ] Pass |
| M4-T7 | Cancel pay-in-store booking works | Cancel pay-in-store booking → status = "cancelled", no refund needed | [ ] Pass |
| M4-T8 | System payment provider works for pay-in-store flow | Order created with "system" provider, status = authorized | [ ] Pass |
| M4-T9 | All integration tests pass | `yarn test:integration:http -- --grep "bookings"` | [ ] Pass |

**Milestone 4 Completed:** [ ] _(Date: _________)_

---

### Milestone 5: Admin API & UI

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/admin/widgets
- [ ] Read: https://docs.medusajs.com/learn/fundamentals/admin/ui-routes

**Tasks:**
1. [ ] Create admin routes for services CRUD
2. [ ] Create admin routes for staff CRUD
3. [ ] Create admin routes for bookings list/update
4. [ ] Build admin UI route: `/bookings` calendar
5. [ ] Build admin UI route: `/bookings/services`
6. [ ] Build admin UI route: `/bookings/staff`
7. [ ] Add widgets for order/customer detail pages

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M5-T1 | `GET /admin/bookings/services` returns services (authed) | With admin auth, returns `{services: [...]}` | [ ] Pass |
| M5-T2 | `POST /admin/bookings/services` creates service | Creates service with deposit settings | [ ] Pass |
| M5-T3 | `POST /admin/bookings/services/:id` updates service | Can toggle `deposit_type`, `payment_modes_allowed` | [ ] Pass |
| M5-T4 | `GET /admin/bookings/staff` returns staff list | Returns staff with availability rules | [ ] Pass |
| M5-T5 | `POST /admin/bookings/staff/:id/availability` manages rules | Can add/update/delete availability rules | [ ] Pass |
| M5-T6 | `GET /admin/bookings` returns all bookings with filters | Filter by date range, status, staff_id works | [ ] Pass |
| M5-T7 | `POST /admin/bookings/:id/complete` marks as completed | Booking status = "completed", `completed_at` set | [ ] Pass |
| M5-T8 | `POST /admin/bookings/:id/no-show` marks as no-show | Booking status = "no_show" | [ ] Pass |
| M5-T9 | Admin UI: `/bookings` page loads | Navigate to `/a/bookings`, page renders without error | [ ] Pass |
| M5-T10 | Admin UI: `/bookings/services` page loads | Can view and edit services list | [ ] Pass |
| M5-T11 | Admin UI: `/bookings/staff` page loads | Can view staff and their schedules | [ ] Pass |
| M5-T12 | Admin UI: Order detail widget shows booking | View order with linked booking → widget displays appointment info | [ ] Pass |
| M5-T13 | Admin UI: Customer detail widget shows bookings | View customer → widget shows their appointments | [ ] Pass |
| M5-T14 | All admin routes require authentication | Unauthenticated requests return 401 | [ ] Pass |

**Milestone 5 Completed:** [ ] _(Date: _________)_

---

### Milestone 6: Polish & Production Readiness

**Documentation to Review First:**
- [ ] Read: https://docs.medusajs.com/resources/commerce-modules/notification
- [ ] Read: https://docs.medusajs.com/learn/debugging-and-testing/testing-tools

**Tasks:**
1. [ ] Email notifications (booking confirmed, reminder)
2. [ ] Define `Booking ↔ Customer` module link
3. [ ] Customer portal: view/cancel bookings in store API
4. [ ] Edge case testing
5. [ ] Documentation

**Verification Tests:**

| Test ID | Test Description | Command | Status |
|---------|------------------|---------|--------|
| M6-T1 | Booking confirmation sends email | Create and confirm booking → notification sent | [ ] Pass |
| M6-T2 | Booking ↔ Customer link works | Query customer → can access their bookings | [ ] Pass |
| M6-T3 | `GET /store/bookings` returns customer's bookings | Authenticated customer sees only their bookings | [ ] Pass |
| M6-T4 | `POST /store/bookings/:id/cancel` works | Customer can cancel their own booking | [ ] Pass |
| M6-T5 | Cannot cancel another customer's booking | Attempt returns 403 | [ ] Pass |
| M6-T6 | Cannot book in the past | Attempt to book past time returns error | [ ] Pass |
| M6-T7 | Cannot book outside business hours | Attempt returns "slot not available" | [ ] Pass |
| M6-T8 | Handles timezone correctly | Book in user's timezone, stored as UTC, displayed correctly | [ ] Pass |
| M6-T9 | All tests pass | `yarn test && yarn test:integration:http` | [ ] Pass |
| M6-T10 | No TypeScript errors | `yarn build` completes without errors | [ ] Pass |
| M6-T11 | Documentation complete | README in module directory explains setup and usage | [ ] Pass |

**Milestone 6 Completed:** [ ] _(Date: _________)_

---

## Test Summary Dashboard

| Milestone | Total Tests | Passed | Status |
|-----------|-------------|--------|--------|
| M1: Foundation | 7 | 0 | ⏳ Not Started |
| M2: Availability | 7 | 0 | ⏳ Not Started |
| M3: Booking Workflows | 8 | 0 | ⏳ Not Started |
| M4: Payment Integration | 9 | 0 | ⏳ Not Started |
| M5: Admin API & UI | 14 | 0 | ⏳ Not Started |
| M6: Polish | 11 | 0 | ⏳ Not Started |
| **Total** | **56** | **0** | |

**Legend:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete

---

## Technical Notes

### Conflict Prevention in PostgreSQL

The `createBookingWithConflictCheck` method should use:

```typescript
async createBookingWithConflictCheck(data: CreateBookingInput): Promise<Booking> {
  return await this.atomicPhase_(async (manager) => {
    // Use SELECT FOR UPDATE to lock the staff's schedule for the time range
    const existingBooking = await manager.query(`
      SELECT id FROM booking
      WHERE staff_id = $1
        AND status IN ('held', 'confirmed')
        AND start_at < $3
        AND end_at > $2
        AND deleted_at IS NULL
      FOR UPDATE
    `, [data.staff_id, data.start_at, data.end_at])

    if (existingBooking.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Time slot is no longer available"
      )
    }

    return await this.bookingRepository_.create(data, { manager })
  })
}
```

### Service Deposit Calculation

```typescript
function calculateDepositAmount(service: Service): BigNumber {
  if (service.deposit_type === DepositType.NONE) {
    return new BigNumber(0)
  }

  if (service.deposit_type === DepositType.FIXED) {
    return new BigNumber(service.deposit_value)
  }

  // Percent
  return new BigNumber(service.price)
    .multipliedBy(service.deposit_value)
    .dividedBy(100)
}
```

---

## Questions to Resolve Before Starting

1. **Multi-staff support from day 1?**
   - If single barber only, Staff model can be simplified
   - Recommend: Include Staff model but start with one record

2. **Guest bookings allowed?**
   - If yes: `customer_id` nullable, require `customer_email`/`customer_phone`
   - Recommend: Allow guest bookings initially

3. **Timezone handling?**
   - Store all times in UTC, convert in frontend
   - Include `timezone` field on Service or Staff

4. **Cancellation policy?**
   - How close to appointment time can cancel?
   - Deposit refundable on cancellation?

5. **Notification preferences?**
   - Email only, or SMS too?
   - Reminder timing (24h before, 1h before)?
