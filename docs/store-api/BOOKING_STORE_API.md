# Booking Store API Developer Guide

A comprehensive guide for frontend developers integrating with the Medusa Booking System.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Complete Booking Flow](#complete-booking-flow)
4. [API Reference](#api-reference)
5. [TypeScript Types](#typescript-types)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [React Query Integration](#react-query-integration)
9. [Important Notes](#important-notes)

---

## Overview

The Booking Store API provides endpoints for:
- Browsing available services
- Checking staff availability
- Creating and managing bookings
- Processing payments (deposit or full)

**Base URL:** `/store/bookings`

---

## Authentication

The booking system supports both **guest** and **authenticated** customer flows.

### Guest Bookings
- No authentication required
- Customer info provided via `customer_email`, `customer_phone`, `customer_name`
- Can hold slots, confirm bookings, and cancel their own bookings

### Authenticated Customers
- JWT token in `Authorization: Bearer <token>` header
- Bookings linked to customer account via `customer_id`
- Can view all their bookings via `GET /store/bookings`

---

## Complete Booking Flow

```
┌──────────────────┐
│  List Services   │  GET /store/bookings/services
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Check Availability│  GET /store/bookings/availability?date=YYYY-MM-DD&service_id=xxx
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Hold a Slot    │  POST /store/bookings (10-minute hold)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Confirm Booking  │  POST /store/bookings/:id/confirm
└────────┬─────────┘
         │
         ├─── payment_mode: "pay_in_store" ──► Booking confirmed immediately
         │
         └─── payment_mode: "deposit" or "full" ──► Returns cart_id for checkout
                                                     │
                                                     ▼
                                              ┌──────────────────┐
                                              │ Complete Checkout│  (Medusa cart/payment flow)
                                              └──────────────────┘
```

---

## API Reference

### 1. List Services

Retrieve all active services available for booking.

```
GET /store/bookings/services
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Number of services to return |
| `offset` | number | 0 | Pagination offset |

**Response:**
```json
{
  "services": [
    {
      "id": "bksvc_01ABC123",
      "name": "Haircut",
      "description": "Standard men's haircut",
      "duration_minutes": 30,
      "buffer_minutes": 10,
      "price": 2500,
      "currency_code": "usd",
      "deposit_type": "percentage",
      "deposit_value": 20,
      "payment_modes_allowed": ["in_person", "online"],
      "is_active": true,
      "metadata": null
    }
  ],
  "count": 1,
  "offset": 0,
  "limit": 50
}
```

---

### 2. Get Available Slots

Retrieve available time slots for a service on a specific date.

```
GET /store/bookings/availability
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date in `YYYY-MM-DD` format |
| `service_id` | string | Yes | ID of the service |
| `staff_id` | string | No | Filter by specific staff member |

**Response:**
```json
{
  "slots": [
    {
      "start_at": "2025-01-15T09:00:00.000Z",
      "end_at": "2025-01-15T09:30:00.000Z",
      "staff_id": "bkstf_01ABC123",
      "staff_name": "John Smith",
      "service_id": "bksvc_01ABC123"
    },
    {
      "start_at": "2025-01-15T09:15:00.000Z",
      "end_at": "2025-01-15T09:45:00.000Z",
      "staff_id": "bkstf_01ABC123",
      "staff_name": "John Smith",
      "service_id": "bksvc_01ABC123"
    }
  ]
}
```

**Notes:**
- Slots are returned in 15-minute intervals
- All times are in **UTC**
- Only active staff with available time are included
- Existing HELD and CONFIRMED bookings are excluded

---

### 3. Hold a Booking Slot

Create a temporary hold on a time slot (10-minute expiration).

```
POST /store/bookings
```

**Request Body:**
```json
{
  "staff_id": "bkstf_01ABC123",
  "service_id": "bksvc_01ABC123",
  "start_at": "2025-01-15T09:00:00.000Z",
  "customer_email": "customer@example.com",
  "customer_phone": "+1234567890",
  "customer_name": "Jane Doe",
  "notes": "Prefers a clean fade"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `staff_id` | string | Yes | ID of the staff member |
| `service_id` | string | Yes | ID of the service |
| `start_at` | string (ISO 8601) | Yes | Start time of the booking |
| `customer_email` | string | No | Customer email (for guest bookings) |
| `customer_phone` | string | No | Customer phone |
| `customer_name` | string | No | Customer name |
| `notes` | string | No | Notes for the appointment |

**Response:**
```json
{
  "booking": {
    "id": "book_01ABC123",
    "display_id": 1,
    "staff_id": "bkstf_01ABC123",
    "service_id": "bksvc_01ABC123",
    "start_at": "2025-01-15T09:00:00.000Z",
    "end_at": "2025-01-15T09:30:00.000Z",
    "status": "held",
    "hold_expires_at": "2025-01-15T08:10:00.000Z",
    "service_name": "Haircut",
    "price_amount": 2500,
    "currency_code": "usd",
    "customer_email": "customer@example.com",
    "customer_phone": "+1234567890",
    "customer_name": "Jane Doe",
    "notes": "Prefers a clean fade"
  }
}
```

**Important:** The hold expires in 10 minutes. Confirm the booking before `hold_expires_at`.

---

### 4. Confirm a Booking

Confirm a held booking with a payment mode.

```
POST /store/bookings/:id/confirm
```

**Request Body:**
```json
{
  "payment_mode": "pay_in_store"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `payment_mode` | string | Yes | `pay_in_store`, `deposit`, `full` |

**Payment Modes:**

| Mode | Description | Response |
|------|-------------|----------|
| `pay_in_store` | Pay at the appointment | `{ booking: {...}, cart_id: null }` |
| `deposit` | Pay deposit online now | `{ booking: null, cart_id: "cart_xxx" }` |
| `full` | Pay full amount online | `{ booking: null, cart_id: "cart_xxx" }` |

**Response (pay_in_store):**
```json
{
  "booking": {
    "id": "book_01ABC123",
    "status": "confirmed",
    "payment_mode": "pay_in_store",
    "confirmed_at": "2025-01-15T08:05:00.000Z",
    "hold_expires_at": null
  },
  "cart_id": null
}
```

**Response (deposit/full):**
```json
{
  "booking": null,
  "cart_id": "cart_01ABC123"
}
```

For `deposit` or `full`, use the returned `cart_id` to complete checkout via Medusa's standard cart/payment flow. The booking will be confirmed automatically when the order is placed.

---

### 5. List Customer Bookings

Retrieve all bookings for the authenticated customer.

```
GET /store/bookings
```

**Authentication:** Required

**Response:**
```json
{
  "bookings": [
    {
      "id": "book_01ABC123",
      "display_id": 1,
      "status": "confirmed",
      "start_at": "2025-01-15T09:00:00.000Z",
      "end_at": "2025-01-15T09:30:00.000Z",
      "service_name": "Haircut",
      "price_amount": 2500,
      "currency_code": "usd"
    }
  ],
  "count": 1,
  "offset": 0,
  "limit": 50
}
```

---

### 6. Get Booking Details

Retrieve details for a specific booking.

```
GET /store/bookings/:id
```

**Authorization:**
- **Guest bookings** (no `customer_id`): Anyone with the booking ID can view
- **Customer bookings**: Only the linked customer can view (requires auth)

**Response:**
```json
{
  "booking": {
    "id": "book_01ABC123",
    "display_id": 1,
    "staff_id": "bkstf_01ABC123",
    "service_id": "bksvc_01ABC123",
    "customer_id": null,
    "start_at": "2025-01-15T09:00:00.000Z",
    "end_at": "2025-01-15T09:30:00.000Z",
    "status": "confirmed",
    "service_name": "Haircut",
    "price_amount": 2500,
    "currency_code": "usd",
    "deposit_amount": 500,
    "payment_mode": "deposit",
    "amount_paid": 500,
    "customer_email": "customer@example.com",
    "customer_phone": "+1234567890",
    "customer_name": "Jane Doe",
    "notes": "Prefers a clean fade",
    "confirmed_at": "2025-01-15T08:05:00.000Z",
    "metadata": null
  }
}
```

---

### 7. Cancel a Booking

Cancel a booking (subject to cancellation window).

```
POST /store/bookings/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Reason for cancellation |

**Authorization:**
- Guest bookings: Anyone with the booking ID can cancel
- Customer bookings: Only the linked customer can cancel

**Cancellation Window:**
- Default: **2 hours** before the booking start time
- Bookings cannot be cancelled within this window

**Response:**
```json
{
  "booking": {
    "id": "book_01ABC123",
    "status": "cancelled",
    "cancelled_at": "2025-01-14T10:00:00.000Z"
  }
}
```

**Error Response (within cancellation window):**
```json
{
  "type": "not_allowed",
  "message": "Cannot cancel booking within 2 hours of start time"
}
```

---

## TypeScript Types

```typescript
// Booking Status
type BookingStatus =
  | "pending"
  | "held"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

// Payment Mode
type PaymentMode = "pay_in_store" | "deposit" | "full"

// Deposit Type
type DepositType = "none" | "percentage" | "fixed"

// Service
interface ServiceDTO {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  buffer_minutes: number
  price: number
  currency_code: string
  region_id: string | null
  deposit_type: DepositType
  deposit_value: number | null
  payment_modes_allowed: ("in_person" | "online")[]
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Available Slot
interface AvailableSlotDTO {
  start_at: string  // ISO 8601
  end_at: string    // ISO 8601
  staff_id: string
  staff_name: string
  service_id: string
}

// Booking
interface BookingDTO {
  id: string
  display_id: number
  staff_id: string
  service_id: string
  customer_id: string | null
  start_at: string
  end_at: string
  status: BookingStatus
  hold_expires_at: string | null
  service_name: string
  price_amount: number
  currency_code: string
  deposit_amount: number | null
  payment_mode: PaymentMode | null
  amount_paid: number | null
  customer_email: string | null
  customer_phone: string | null
  customer_name: string | null
  notes: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Request Types
interface HoldBookingRequest {
  staff_id: string
  service_id: string
  start_at: string
  customer_email?: string
  customer_phone?: string
  customer_name?: string
  notes?: string
}

interface ConfirmBookingRequest {
  payment_mode: PaymentMode
}

interface CancelBookingRequest {
  reason?: string
}

// Response Types
interface ServicesResponse {
  services: ServiceDTO[]
  count: number
  offset: number
  limit: number
}

interface AvailabilityResponse {
  slots: AvailableSlotDTO[]
}

interface BookingResponse {
  booking: BookingDTO
}

interface ConfirmBookingResponse {
  booking: BookingDTO | null
  cart_id: string | null
}
```

---

## Code Examples

### Fetch Available Services

```typescript
async function getServices(limit = 50, offset = 0): Promise<ServicesResponse> {
  const response = await fetch(
    `/store/bookings/services?limit=${limit}&offset=${offset}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`)
  }

  return response.json()
}
```

### Check Availability

```typescript
async function getAvailableSlots(
  date: string, // YYYY-MM-DD
  serviceId: string,
  staffId?: string
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({
    date,
    service_id: serviceId,
  })

  if (staffId) {
    params.append("staff_id", staffId)
  }

  const response = await fetch(`/store/bookings/availability?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`)
  }

  return response.json()
}
```

### Hold a Booking Slot

```typescript
async function holdBookingSlot(data: HoldBookingRequest): Promise<BookingResponse> {
  const response = await fetch("/store/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to hold booking slot")
  }

  return response.json()
}
```

### Confirm a Booking

```typescript
async function confirmBooking(
  bookingId: string,
  paymentMode: PaymentMode
): Promise<ConfirmBookingResponse> {
  const response = await fetch(`/store/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payment_mode: paymentMode }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to confirm booking")
  }

  return response.json()
}

// Usage
const result = await confirmBooking("book_01ABC123", "pay_in_store")

if (result.cart_id) {
  // Redirect to checkout with cart_id
  window.location.href = `/checkout?cart_id=${result.cart_id}`
} else {
  // Booking confirmed immediately
  console.log("Booking confirmed:", result.booking)
}
```

### Cancel a Booking

```typescript
async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<BookingResponse> {
  const response = await fetch(`/store/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to cancel booking")
  }

  return response.json()
}
```

### Get Customer's Bookings (Authenticated)

```typescript
async function getMyBookings(token: string): Promise<{ bookings: BookingDTO[] }> {
  const response = await fetch("/store/bookings", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.statusText}`)
  }

  return response.json()
}
```

---

## Error Handling

### Common Error Responses

```typescript
interface ErrorResponse {
  type: string
  message: string
}

// Error types
type ErrorType =
  | "not_found"      // Resource not found (404)
  | "invalid_data"   // Validation error (400)
  | "not_allowed"    // Authorization/business rule error (403)
  | "unauthorized"   // Authentication required (401)
```

### Error Handling Example

```typescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes("Slot is not available")) {
        // The slot was taken by someone else
        alert("Sorry, this slot is no longer available. Please choose another.")
      } else if (error.message.includes("Cannot cancel booking within")) {
        // Too close to appointment time
        alert("This booking cannot be cancelled online. Please contact us.")
      } else if (error.message.includes("Not authorized")) {
        // User doesn't own this booking
        alert("You don't have permission to view/modify this booking.")
      } else {
        // Generic error
        alert(`An error occurred: ${error.message}`)
      }
    }
    throw error
  }
}
```

---

## React Query Integration

### Setup

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Query keys
const bookingKeys = {
  all: ["bookings"] as const,
  services: () => [...bookingKeys.all, "services"] as const,
  availability: (date: string, serviceId: string) =>
    [...bookingKeys.all, "availability", date, serviceId] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
  customer: () => [...bookingKeys.all, "customer"] as const,
}
```

### Hooks

```typescript
// Fetch services
export function useServices(limit = 50, offset = 0) {
  return useQuery({
    queryKey: bookingKeys.services(),
    queryFn: () => getServices(limit, offset),
  })
}

// Fetch availability
export function useAvailability(
  date: string,
  serviceId: string,
  staffId?: string
) {
  return useQuery({
    queryKey: bookingKeys.availability(date, serviceId),
    queryFn: () => getAvailableSlots(date, serviceId, staffId),
    enabled: !!date && !!serviceId,
  })
}

// Hold booking mutation
export function useHoldBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holdBookingSlot,
    onSuccess: (data, variables) => {
      // Invalidate availability cache
      queryClient.invalidateQueries({
        queryKey: bookingKeys.availability(
          variables.start_at.split("T")[0],
          variables.service_id
        ),
      })
    },
  })
}

// Confirm booking mutation
export function useConfirmBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, paymentMode }: {
      bookingId: string
      paymentMode: PaymentMode
    }) => confirmBooking(bookingId, paymentMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
  })
}

// Cancel booking mutation
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, reason }: {
      bookingId: string
      reason?: string
    }) => cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
  })
}
```

### Usage in Components

```tsx
function BookingForm({ serviceId }: { serviceId: string }) {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDTO | null>(null)

  const { data: availability, isLoading } = useAvailability(
    selectedDate,
    serviceId
  )

  const holdBooking = useHoldBooking()
  const confirmBooking = useConfirmBooking()

  const handleBooking = async () => {
    if (!selectedSlot) return

    try {
      // 1. Hold the slot
      const { booking } = await holdBooking.mutateAsync({
        staff_id: selectedSlot.staff_id,
        service_id: serviceId,
        start_at: selectedSlot.start_at,
        customer_email: "customer@example.com",
      })

      // 2. Confirm with pay_in_store
      const result = await confirmBooking.mutateAsync({
        bookingId: booking.id,
        paymentMode: "pay_in_store",
      })

      alert("Booking confirmed!")
    } catch (error) {
      console.error("Booking failed:", error)
    }
  }

  return (
    <div>
      {/* Date picker and slot selection UI */}
      <button onClick={handleBooking} disabled={!selectedSlot}>
        Book Now
      </button>
    </div>
  )
}
```

---

## Important Notes

### Timezones

- All times in API requests and responses are in **UTC**
- Convert to local timezone for display
- Example:
  ```typescript
  const utcTime = new Date(slot.start_at)
  const localTime = utcTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
  ```

### Hold Duration

- Holds expire after **10 minutes**
- Display a countdown timer to the user
- Re-fetch availability if hold expires

### Cancellation Window

- Default: **2 hours** before appointment
- Cannot cancel bookings within this window via API
- Direct customers to contact support for late cancellations

### Payment Flow

For `deposit` or `full` payment modes:
1. Confirm booking returns `cart_id`
2. Use Medusa's standard cart checkout flow
3. Booking is automatically confirmed when order is placed
4. If cart is abandoned, the hold expires and slot is released

### Rate Limiting

Consider implementing client-side debouncing for:
- Availability queries (user selecting dates)
- Slot selection (prevent double-booking)

### Offline Handling

- Cache services list for offline display
- Show "offline" state for availability checks
- Queue booking requests if connection is lost
