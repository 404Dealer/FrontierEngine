import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"

// -------------------- Booking Validators --------------------

export const AdminGetBookingsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    staff_id: z.union([z.string(), z.array(z.string())]).optional(),
    service_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_email: z.string().optional(),
    start_at: createOperatorMap().optional(),
    end_at: createOperatorMap().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    q: z.string().optional(),
  })
)

export type AdminGetBookingsParamsType = z.infer<typeof AdminGetBookingsParams>

export const AdminGetBookingParams = createSelectParams()

export type AdminGetBookingParamsType = z.infer<typeof AdminGetBookingParams>

export const AdminCreateBooking = z.object({
  staff_id: z.string(),
  service_id: z.string(),
  customer_id: z.string().nullish(),
  start_at: z.string().or(z.date()),
  end_at: z.string().or(z.date()),
  status: z
    .enum(["pending", "held", "confirmed", "completed", "cancelled", "no_show"])
    .optional(),
  hold_expires_at: z.string().or(z.date()).nullish(),
  service_name: z.string(),
  price_amount: z.union([z.string(), z.number()]),
  currency_code: z.string(),
  deposit_amount: z.union([z.string(), z.number()]).nullish(),
  payment_mode: z.enum(["in_person", "online"]).nullish(),
  amount_paid: z.union([z.string(), z.number()]).nullish(),
  customer_email: z.string().email().nullish(),
  customer_phone: z.string().nullish(),
  customer_name: z.string().nullish(),
  notes: z.string().nullish(),
  internal_notes: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminCreateBookingType = z.infer<typeof AdminCreateBooking>

export const AdminUpdateBooking = z.object({
  status: z
    .enum(["pending", "held", "confirmed", "completed", "cancelled", "no_show"])
    .optional(),
  hold_expires_at: z.string().or(z.date()).nullish(),
  payment_mode: z.enum(["in_person", "online"]).nullish(),
  amount_paid: z.union([z.string(), z.number()]).nullish(),
  customer_email: z.string().email().nullish(),
  customer_phone: z.string().nullish(),
  customer_name: z.string().nullish(),
  notes: z.string().nullish(),
  internal_notes: z.string().nullish(),
  confirmed_at: z.string().or(z.date()).nullish(),
  cancelled_at: z.string().or(z.date()).nullish(),
  completed_at: z.string().or(z.date()).nullish(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminUpdateBookingType = z.infer<typeof AdminUpdateBooking>

// -------------------- Service Validators --------------------

export const AdminGetServicesParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    name: z.union([z.string(), createOperatorMap()]).optional(),
    is_active: z.boolean().optional(),
    currency_code: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
  })
)

export type AdminGetServicesParamsType = z.infer<typeof AdminGetServicesParams>

export const AdminGetServiceParams = createSelectParams()

export type AdminGetServiceParamsType = z.infer<typeof AdminGetServiceParams>

export const AdminCreateService = z.object({
  name: z.string(),
  description: z.string().nullish(),
  duration_minutes: z.number().positive().optional().default(60),
  buffer_minutes: z.number().nonnegative().optional().default(0),
  price: z.union([z.string(), z.number()]),
  currency_code: z.string().optional().default("usd"),
  deposit_type: z.enum(["none", "percentage", "fixed"]).optional().default("none"),
  deposit_value: z.union([z.string(), z.number()]).nullish(),
  payment_modes_allowed: z
    .array(z.enum(["in_person", "online"]))
    .optional()
    .default(["in_person", "online"]),
  is_active: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminCreateServiceType = z.infer<typeof AdminCreateService>

export const AdminUpdateService = z.object({
  name: z.string().optional(),
  description: z.string().nullish(),
  duration_minutes: z.number().positive().optional(),
  buffer_minutes: z.number().nonnegative().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  currency_code: z.string().optional(),
  deposit_type: z.enum(["none", "percentage", "fixed"]).optional(),
  deposit_value: z.union([z.string(), z.number()]).nullish(),
  payment_modes_allowed: z.array(z.enum(["in_person", "online"])).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminUpdateServiceType = z.infer<typeof AdminUpdateService>

// -------------------- Staff Validators --------------------

export const AdminGetStaffsParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    name: z.union([z.string(), createOperatorMap()]).optional(),
    email: z.union([z.string(), createOperatorMap()]).optional(),
    is_active: z.boolean().optional(),
    q: z.string().optional(),
  })
)

export type AdminGetStaffsParamsType = z.infer<typeof AdminGetStaffsParams>

export const AdminGetStaffParams = createSelectParams()

export type AdminGetStaffParamsType = z.infer<typeof AdminGetStaffParams>

export const AdminCreateStaff = z.object({
  name: z.string(),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  bio: z.string().nullish(),
  avatar_url: z.string().url().nullish(),
  is_active: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminCreateStaffType = z.infer<typeof AdminCreateStaff>

export const AdminUpdateStaff = z.object({
  name: z.string().optional(),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  bio: z.string().nullish(),
  avatar_url: z.string().url().nullish(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminUpdateStaffType = z.infer<typeof AdminUpdateStaff>

// -------------------- Booking Settings Validators --------------------

export const AdminGetBookingSettingsParams = createSelectParams()

export type AdminGetBookingSettingsParamsType = z.infer<
  typeof AdminGetBookingSettingsParams
>

export const AdminUpdateBookingSettings = z.object({
  allow_guest_bookings: z.boolean().optional(),
  default_hold_duration_minutes: z.number().positive().optional(),
  cancellation_window_hours: z.number().nonnegative().optional(),
  timezone: z.string().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminUpdateBookingSettingsType = z.infer<
  typeof AdminUpdateBookingSettings
>

// -------------------- Availability Rule Validators --------------------

export const AdminGetAvailabilityRulesParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    rule_type: z.union([z.string(), z.array(z.string())]).optional(),
    day_of_week: z.union([z.number(), z.array(z.number())]).optional(),
    is_available: z.boolean().optional(),
  })
)

export type AdminGetAvailabilityRulesParamsType = z.infer<
  typeof AdminGetAvailabilityRulesParams
>

export const AdminGetAvailabilityRuleParams = createSelectParams()

export type AdminGetAvailabilityRuleParamsType = z.infer<
  typeof AdminGetAvailabilityRuleParams
>

export const AdminCreateAvailabilityRule = z.object({
  rule_type: z.enum(["recurring", "exception", "blocked"]),
  day_of_week: z.number().min(0).max(6).nullish(),
  specific_date: z.string().nullish(),
  start_time: z.string().nullish(),
  end_time: z.string().nullish(),
  is_available: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminCreateAvailabilityRuleType = z.infer<
  typeof AdminCreateAvailabilityRule
>

export const AdminUpdateAvailabilityRule = z.object({
  day_of_week: z.number().min(0).max(6).nullish(),
  specific_date: z.string().nullish(),
  start_time: z.string().nullish(),
  end_time: z.string().nullish(),
  is_available: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type AdminUpdateAvailabilityRuleType = z.infer<
  typeof AdminUpdateAvailabilityRule
>
