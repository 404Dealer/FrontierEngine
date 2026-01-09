import { PaymentMode } from "@medusajs/framework/types"
import { z } from "zod"

/**
 * Query parameters for GET /store/bookings/services
 */
export const StoreGetServicesParams = z.object({
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
})

export type StoreGetServicesParamsType = z.infer<typeof StoreGetServicesParams>

/**
 * Query parameters for GET /store/bookings/availability
 */
export const StoreGetAvailabilityParams = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  }),
  service_id: z.string().min(1, "service_id is required"),
  staff_id: z.string().optional(),
})

export type StoreGetAvailabilityParamsType = z.infer<
  typeof StoreGetAvailabilityParams
>

/**
 * Request body for POST /store/bookings (hold a slot)
 */
export const StoreHoldBooking = z.object({
  staff_id: z.string().min(1, "staff_id is required"),
  service_id: z.string().min(1, "service_id is required"),
  start_at: z.string().or(z.date()),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
  notes: z.string().optional(),
})

export type StoreHoldBookingType = z.infer<typeof StoreHoldBooking>

/**
 * Request body for POST /store/bookings/:id/confirm
 */
export const StoreConfirmBooking = z.object({
  payment_mode: z.nativeEnum(PaymentMode),
  region_id: z.string().optional(),
})

export type StoreConfirmBookingType = z.infer<typeof StoreConfirmBooking>

/**
 * Request body for POST /store/bookings/:id/cancel
 */
export const StoreCancelBooking = z.object({
  reason: z.string().optional(),
})

export type StoreCancelBookingType = z.infer<typeof StoreCancelBooking>
