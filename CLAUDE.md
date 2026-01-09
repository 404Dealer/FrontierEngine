# Medusa Core

Open-source commerce platform. TypeScript monorepo with 35+ modular commerce packages.

## 1. Codebase Structure

### Monorepo Organization

```
/packages/
├── medusa/                 # Main Medusa package (entry point)
├── core/                   # Core framework packages
│   ├── framework/          # Core runtime, HTTP, database
│   ├── types/              # TypeScript definitions and DTOs
│   ├── utils/              # Utilities, decorators, error handling
│   ├── workflows-sdk/      # Workflow composition framework
│   ├── core-flows/         # Predefined workflows (order, product, etc.)
│   ├── modules-sdk/        # Module development utilities
│   ├── orchestration/      # Orchestration layer
│   └── js-sdk/             # JavaScript SDK
├── modules/                # 35+ commerce modules
│   ├── order/, product/, cart/, payment/, customer/, etc.
│   ├── workflow-engine-inmemory/, workflow-engine-redis/
│   ├── event-bus-local/, event-bus-redis/
│   ├── cache-inmemory/, cache-redis/
│   ├── link-modules/       # Module linking utilities
│   └── providers/          # 15+ provider implementations
│       ├── payment-stripe/
│       ├── file-local/, file-s3/
│       ├── fulfillment-manual/
│       └── locking-postgres/, locking-redis/
├── admin/                  # Dashboard packages
│   ├── dashboard/          # React admin UI (Vite + React 18)
│   ├── admin-sdk/          # Admin SDK
│   ├── admin-shared/       # Shared admin utilities
│   ├── admin-bundler/      # Admin bundling tool
│   └── admin-vite-plugin/  # Vite plugin for admin
├── cli/                    # CLI tools
│   ├── medusa-cli/         # Main CLI tool
│   ├── create-medusa-app/  # Scaffolding tool
│   └── oas/                # OpenAPI specification tools
├── design-system/          # UI components
│   ├── ui/                 # Component library (Storybook)
│   ├── icons/              # Icon library
│   └── ui-preset/          # Tailwind CSS preset
└── medusa-test-utils/      # Test utilities
/integration-tests/         # Full-stack integration tests
├── http/                   # HTTP integration tests
├── api/                    # API integration tests
├── modules/                # Module integration tests
└── repositories/           # Repository layer tests
/www/                       # Documentation site
```

### Key Directories

- `packages/core/framework/` - Core runtime, HTTP, database
- `packages/medusa/src/api/` - API routes (admin/, store/, auth/, hooks/)
- `packages/modules/` - Commerce feature modules
- `packages/admin/dashboard/` - Admin React app
- `packages/core/core-flows/src/` - Predefined workflow steps and workflows

## 2. Build System & Commands

### Package Manager

Yarn 3.2.1 with node-modules linker. Build orchestration via Turbo 1.6.3.

### Essential Commands

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Build specific package
yarn workspace @medusajs/medusa build
yarn workspace @medusajs/order build

# Watch mode (in package directory)
yarn watch

# Lint entire codebase
yarn lint

# Format with Prettier
yarn prettier
```

### Testing Commands

```bash
# All unit tests
yarn test

# Run tests in chunks
yarn test:chunk

# Package integration tests
yarn test:integration:packages
yarn test:integration:packages:fast
yarn test:integration:packages:slow

# HTTP integration tests
yarn test:integration:http

# API integration tests
yarn test:integration:api

# Module integration tests
yarn test:integration:modules
```

### Per-Package Commands

```bash
# In a module directory (e.g., packages/modules/order/)
yarn build                    # Build with tsc and alias resolution
yarn watch                    # Watch TypeScript compilation
yarn test                     # Jest unit tests
yarn test:integration         # Jest integration tests
yarn resolve:aliases          # Resolve TypeScript path aliases

# MikroORM migrations
yarn migration:generate       # Generate migration
yarn migration:run            # Run migrations
```

## 3. Testing Conventions

### Frameworks

- Jest 29.7.0 (backend/core) with @swc/jest transpiler
- Vitest 3.0.5 (admin/frontend)

### Test Locations

- Unit tests: `src/__tests__/` or `src/services/__tests__/`
- Package integration tests: `packages/*/integration-tests/__tests__/`
- HTTP integration tests: `integration-tests/http/__tests__/`
- Fixtures: `__fixtures__/` directories
- Mocks: `__mocks__/` directories

### Patterns

- File extension: `.spec.ts` or `.test.ts`
- Unit test structure: `describe/it` blocks
- Integration tests: Custom test runners with DB setup
- Test timeout: 10 seconds for integration tests

### Unit Test Example

```typescript
describe("OrderService", function () {
  it("should create order with valid data", async function () {
    const result = await orderService.create({
      // test data
    })
    expect(result).toMatchObject({
      // expected shape
    })
  })
})
```

## 4. Code Style Conventions

### Formatting (Prettier)

- No semicolons
- Double quotes
- 2 space indentation
- ES5 trailing commas
- Always use parens in arrow functions

### TypeScript

- Target: ES2021
- Module: Node16
- Strict null checks enabled
- Decorators enabled (experimental)
- emitDecoratorMetadata enabled

### Naming Conventions

- Files: kebab-case (`define-config.ts`, `order-module-service.ts`)
- Types/Interfaces/Classes: PascalCase (`Order`, `OrderDTO`)
- Functions/Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- DB fields: snake_case

### ESLint Rules

- `curly`: "all"
- `max-len`: 80 characters (ignores strings, URLs, comments)
- `@typescript-eslint/no-floating-promises`: error
- `@typescript-eslint/await-thenable`: error
- `@typescript-eslint/promise-function-async`: error

### Export Patterns

- Barrel exports via `export * from`
- Named re-exports for specific items
- Public API defined in `src/index.ts`

## 5. Architecture Patterns

### 5.1 Module Structure

Standard module organization:

```
module-name/
├── src/
│   ├── models/           # Entity definitions using model DSL
│   ├── services/         # Business logic with MedusaService
│   ├── repositories/     # Data access layer (MikroORM)
│   ├── types/            # DTO and type definitions
│   ├── utils/            # Helper functions
│   ├── migrations/       # Database migrations
│   └── index.ts          # Public API
├── integration-tests/    # Integration test suite
├── package.json
├── tsconfig.json
└── jest.config.js
```

### 5.2 Model Definition Pattern

Define entities with the model DSL:

```typescript
import { model } from "@medusajs/framework/utils"

const Order = model.define("Order", {
  id: model.id({ prefix: "order" }).primaryKey(),
  display_id: model.autoincrement().searchable(),
  status: model.enum(OrderStatus).default(OrderStatus.PENDING),
  email: model.text().searchable().nullable(),
  currency_code: model.text(),
  items: model.hasMany(() => OrderItem, { mappedBy: "order" }),
  customer: model.belongsTo(() => Customer, { mappedBy: "orders" }),
})
.cascades({ delete: ["items"] })

export default Order
```

**Field Types:** `id`, `text`, `number`, `boolean`, `json`, `enum`, `dateTime`, `autoincrement`

**Relationships:** `hasOne`, `hasMany`, `belongsTo`, `manyToMany`

**Reference Files:**
- `packages/modules/order/src/models/order.ts`
- `packages/modules/product/src/models/product.ts`

### 5.3 Service Pattern - Services with Decorators

**Service Structure:**
- Extend `MedusaService<T>` with typed model definitions
- Inject dependencies via constructor
- Use decorators for cross-cutting concerns

**Key Decorators:**
- `@InjectManager()` - Inject entity manager (use on public methods)
- `@InjectTransactionManager()` - Inject transaction manager (use on protected methods)
- `@MedusaContext()` - Inject shared context as parameter
- `@EmitEvents()` - Emit domain events after operation

**Example:**

```typescript
export class OrderModuleService
  extends MedusaService<{ Order: { dto: OrderDTO } }>({ Order })
  implements IOrderModuleService
{
  @InjectManager()
  @EmitEvents()
  async deleteOrders(
    ids: string[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    return await this.deleteOrders_(ids, sharedContext)
  }

  @InjectTransactionManager()
  protected async deleteOrders_(
    ids: string[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    await this.orderService_.softDelete(ids, sharedContext)
  }
}
```

**Reference Files:**
- `packages/modules/order/src/services/order-module-service.ts`
- `packages/modules/api-key/src/services/api-key-module-service.ts`
- `packages/modules/product/src/services/product-module-service.ts`

### 5.4 Repository Pattern

```typescript
import { DALUtils } from "@medusajs/framework/utils"
import { setFindMethods } from "../utils"
import { Order } from "@models"

export class OrderRepository extends DALUtils.mikroOrmBaseRepositoryFactory(Order) {}

setFindMethods(OrderRepository, Order)
```

### 5.5 API Route Pattern

**Route Structure:**
- Named exports for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Type request: `AuthenticatedMedusaRequest<T>` or `MedusaRequest<T>`
- Type response: `MedusaResponse<T>`
- Access dependencies from `req.scope`
- Use workflows from `@medusajs/core-flows`

**Example:**

```typescript
import { deleteOrderWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderDeleteResponse>
) => {
  const { id } = req.params

  await deleteOrderWorkflow(req.scope).run({
    input: { id },
  })

  res.status(200).json({
    id,
    object: "order",
    deleted: true,
  })
}
```

**Common Patterns:**
- Filters: `req.filterableFields`
- Pagination: `req.queryConfig.pagination`
- Fields: `req.queryConfig.fields`
- Resolve services: `req.scope.resolve(ContainerRegistrationKeys.QUERY)`

**Reference Files:**
- `packages/medusa/src/api/admin/orders/route.ts`
- `packages/medusa/src/api/admin/orders/[id]/route.ts`
- `packages/medusa/src/api/admin/payment-collections/[id]/route.ts`

### 5.6 Workflow Pattern

**Step Definition:**
- Create steps with `createStep(id, mainAction, compensationAction?)`
- Return `StepResponse(result, compensationData)`
- Compensation function handles rollback

**Workflow Composition:**
- Create workflows with `createWorkflow(id, function)`
- Use `WorkflowData<T>` for typed input
- Return `WorkflowResponse<T>` for typed output
- Chain steps, use `transform()`, `when()`, `parallelize()`
- Query data with `useQueryGraphStep()`
- Emit events with `createHook()`

**Example Step:**

```typescript
export const deletePromotionsStep = createStep(
  "delete-promotions",
  async (ids: string[], { container }) => {
    const promotionModule = container.resolve<IPromotionModuleService>(
      Modules.PROMOTION
    )
    await promotionModule.softDeletePromotions(ids)
    return new StepResponse(void 0, ids)
  },
  async (idsToRestore, { container }) => {
    if (!idsToRestore?.length) return
    const promotionModule = container.resolve<IPromotionModuleService>(
      Modules.PROMOTION
    )
    await promotionModule.restorePromotions(idsToRestore)
  }
)
```

**Example Workflow:**

```typescript
export const deletePromotionsWorkflow = createWorkflow(
  "delete-promotions",
  (input: WorkflowData<{ ids: string[] }>) => {
    const deletedPromotions = deletePromotionsStep(input.ids)
    const promotionsDeleted = createHook("promotionsDeleted", {
      ids: input.ids,
    })
    return new WorkflowResponse(deletedPromotions, {
      hooks: [promotionsDeleted],
    })
  }
)
```

**Reference Files:**
- `packages/core/core-flows/src/promotion/steps/delete-promotions.ts`
- `packages/core/core-flows/src/promotion/workflows/delete-promotions.ts`
- `packages/core/core-flows/src/order/workflows/update-order.ts`

### 5.7 Error Handling

**MedusaError Pattern:**
- Use `new MedusaError(type, message)` for all error throwing
- Provide contextual, user-friendly error messages
- Validate inputs early in services and workflow steps

**Common Error Types:**
- `MedusaError.Types.NOT_FOUND` - Resource not found
- `MedusaError.Types.INVALID_DATA` - Invalid input or state
- `MedusaError.Types.NOT_ALLOWED` - Operation not permitted

**Example:**

```typescript
import { MedusaError, validateEmail } from "@medusajs/framework/utils"

// In service
if (!entity) {
  throw new MedusaError(
    MedusaError.Types.NOT_FOUND,
    `Order with id: ${id} was not found`
  )
}

// In workflow step
if (input.email) {
  validateEmail(input.email)
}

if (order.status === "cancelled") {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "Cannot update a cancelled order"
  )
}
```

**Reference Files:**
- `packages/core/utils/src/modules-sdk/medusa-internal-service.ts`
- `packages/core/core-flows/src/order/workflows/update-order.ts`

### 5.8 Common Import Patterns

**Path Aliases (configured in tsconfig.json):**
- `@models` - Entity models
- `@types` - DTO and type definitions
- `@services` - Service dependencies
- `@repositories` - Data access layer
- `@utils` - Utility functions

**Framework Imports:**

```typescript
// Utils and decorators
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
  EmitEvents,
  Modules,
  model,
  DALUtils,
} from "@medusajs/framework/utils"

// Types
import type {
  Context,
  DAL,
  IOrderModuleService,
  OrderDTO,
} from "@medusajs/framework/types"

// Workflows
import {
  WorkflowData,
  WorkflowResponse,
  StepResponse,
  createStep,
  createWorkflow,
  createHook,
  transform,
  when,
  parallelize,
} from "@medusajs/framework/workflows-sdk"

// Core flows
import { deleteOrderWorkflow } from "@medusajs/core-flows"

// HTTP
import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
```

## 6. Frontend/Admin Development

### Admin Dashboard

- **Build tool:** Vite 5.4.21
- **Framework:** React 18.3.1
- **State management:** TanStack React Query 5.64.2
- **Forms:** React Hook Form 7.49.1
- **Routing:** React Router 6.20.1
- **i18n:** i18next 23.7.11
- **Validation:** Zod 3.25.76

### Design System

- **Styling:** Tailwind CSS 3.4.3
- **Components:** Radix UI 1.1.2
- **Documentation:** Storybook 8.3.5
- **Drag and drop:** dnd-kit 6.1.0

## 7. CI/CD & Development Workflows

### GitHub Actions

- `claude.yml` - Claude Code integration for issues/PRs
- `test-cli-with-database.yml` - CLI testing with DB
- `docs-test.yml` - Documentation build and testing
- `trigger-release.yml` - Release orchestration
- `admin-i18n-validation.yml` - Translation validation

### Changesets

Version management via @changesets/cli:

```bash
yarn changeset           # Create new changeset
yarn changeset:version   # Update versions
yarn changeset:publish   # Publish packages
```

### Local Development

1. Fork and clone the repository
2. Run `yarn install`
3. Create test project with `npx create-medusa-app@latest`
4. Use `file:` resolutions for local development
5. Run `yarn build` to build packages
6. Run `yarn test` to verify changes

## 8. Key Dependencies

### Core

- TypeScript 5.6.2
- Express.js 4.21.0
- Turbo 1.6.3
- Zod 3.25.76
- BigNumber.js 9.1.2

### Testing

- Jest 29.7.0
- Vitest 3.0.5
- @swc/jest 0.2.36

### Admin UI

- React 18.3.1
- Vite 5.4.21
- TanStack React Query 5.64.2
- Tailwind CSS 3.4.3

**Node Version:** >= 20

## 9. Booking Module (Custom)

This Medusa installation includes a custom booking module for barbershop appointment scheduling.

### Module Location

```
packages/modules/booking/
├── src/
│   ├── models/           # Entity models (staff, service, booking, availability-rule)
│   ├── services/         # BookingModuleService
│   ├── types/            # DTO definitions
│   ├── utils/            # Availability calculation utilities
│   └── migrations/       # Database migrations
```

### Key Entities

- **BookingStaff** - Barbers/staff members (prefix: `bkstf`)
- **BookingService** - Services offered (prefix: `bksvc`)
- **BookingRecord** - Booking appointments (prefix: `bkrec`)
- **BookingAvailabilityRule** - Staff availability rules (prefix: `bkavr`)
- **BookingSettings** - Global booking settings (singleton)

### Store API Endpoints

```
GET  /store/bookings/services           # List available services
GET  /store/bookings/availability       # Get available time slots
     Query: date (YYYY-MM-DD), service_id, staff_id?
POST /store/bookings                    # Hold a booking slot (10-min expiry)
POST /store/bookings/:id/confirm        # Confirm with payment_mode
GET  /store/bookings/:id                # Get booking details
POST /store/bookings/:id/cancel         # Cancel a booking
```

### Admin API Endpoints

```
# Bookings
GET    /admin/bookings
POST   /admin/bookings
GET    /admin/bookings/:id
PUT    /admin/bookings/:id
DELETE /admin/bookings/:id

# Staff
GET    /admin/bookings/staff
POST   /admin/bookings/staff
GET    /admin/bookings/staff/:id
PUT    /admin/bookings/staff/:id
DELETE /admin/bookings/staff/:id

# Staff Availability
GET    /admin/bookings/staff/:id/availability
POST   /admin/bookings/staff/:id/availability
PUT    /admin/bookings/staff/:id/availability/:ruleId
DELETE /admin/bookings/staff/:id/availability/:ruleId

# Services
GET    /admin/bookings/services
POST   /admin/bookings/services
GET    /admin/bookings/services/:id
PUT    /admin/bookings/services/:id
DELETE /admin/bookings/services/:id

# Settings
GET    /admin/bookings/settings
PUT    /admin/bookings/settings
```

### Availability Response Structure

```typescript
interface AvailableSlotDTO {
  start_at: Date     // ISO 8601
  end_at: Date       // ISO 8601
  staff_id: string
  staff_name: string // Required, non-empty
  service_id: string
}
```

### Availability Rules

Staff availability is managed through three rule types:
- **RECURRING** - Weekly schedule (day_of_week: 0-6, Mon-Sun)
- **EXCEPTION** - Override for specific date
- **BLOCKED** - Block specific date entirely

Priority: BLOCKED > EXCEPTION > RECURRING

### Core Flows

```
packages/core/core-flows/src/booking/
├── steps/
│   ├── create-booking.ts
│   ├── update-booking.ts
│   ├── validate-slot-availability.ts
│   ├── validate-booking-for-confirmation.ts
│   ├── validate-cancellation-window.ts
│   └── create-booking-cart.ts
└── workflows/
    ├── hold-booking-slot.ts
    ├── confirm-booking.ts
    └── cancel-booking.ts
```

### Important Notes

- Staff `name` is required and must be non-empty (validated in admin API)
- Time slots are generated in 15-minute intervals
- Booking hold expires after 10 minutes (configurable in settings)
- All times use local timezone for display, stored as UTC
