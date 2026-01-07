import type { BigNumberInput } from "../totals"
import type {
  BookingStatus,
  DayOfWeek,
  DepositType,
  PaymentMode,
  PaymentModeAllowed,
  RuleType,
} from "./common"

// -------------------- Service Mutations --------------------

/**
 * The data to create a service.
 */
export interface CreateServiceDTO {
  /**
   * The name of the service.
   */
  name: string
  /**
   * The description of the service.
   */
  description?: string | null
  /**
   * The duration of the service in minutes.
   */
  duration_minutes?: number
  /**
   * The buffer time after the service in minutes.
   */
  buffer_minutes?: number
  /**
   * The price of the service.
   */
  price: BigNumberInput
  /**
   * The currency code of the price.
   */
  currency_code?: string
  /**
   * The ID of the region this service operates in.
   */
  region_id?: string | null
  /**
   * The deposit type for the service.
   */
  deposit_type?: DepositType
  /**
   * The deposit value (percentage or fixed amount).
   */
  deposit_value?: BigNumberInput | null
  /**
   * The payment modes allowed for this service.
   */
  payment_modes_allowed?: PaymentModeAllowed[]
  /**
   * Whether the service is active.
   */
  is_active?: boolean
  /**
   * Custom metadata for the service.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a service.
 */
export interface UpdateServiceDTO {
  /**
   * The ID of the service to update.
   */
  id: string
  /**
   * The name of the service.
   */
  name?: string
  /**
   * The description of the service.
   */
  description?: string | null
  /**
   * The duration of the service in minutes.
   */
  duration_minutes?: number
  /**
   * The buffer time after the service in minutes.
   */
  buffer_minutes?: number
  /**
   * The price of the service.
   */
  price?: BigNumberInput
  /**
   * The currency code of the price.
   */
  currency_code?: string
  /**
   * The ID of the region this service operates in.
   */
  region_id?: string | null
  /**
   * The deposit type for the service.
   */
  deposit_type?: DepositType
  /**
   * The deposit value (percentage or fixed amount).
   */
  deposit_value?: BigNumberInput | null
  /**
   * The payment modes allowed for this service.
   */
  payment_modes_allowed?: PaymentModeAllowed[]
  /**
   * Whether the service is active.
   */
  is_active?: boolean
  /**
   * Custom metadata for the service.
   */
  metadata?: Record<string, unknown> | null
}

// -------------------- Staff Mutations --------------------

/**
 * The data to create a staff member.
 */
export interface CreateStaffDTO {
  /**
   * The name of the staff member.
   */
  name: string
  /**
   * The email of the staff member.
   */
  email?: string | null
  /**
   * The phone number of the staff member.
   */
  phone?: string | null
  /**
   * The bio of the staff member.
   */
  bio?: string | null
  /**
   * The avatar URL of the staff member.
   */
  avatar_url?: string | null
  /**
   * Whether the staff member is active.
   */
  is_active?: boolean
  /**
   * Custom metadata for the staff member.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a staff member.
 */
export interface UpdateStaffDTO {
  /**
   * The ID of the staff member to update.
   */
  id: string
  /**
   * The name of the staff member.
   */
  name?: string
  /**
   * The email of the staff member.
   */
  email?: string | null
  /**
   * The phone number of the staff member.
   */
  phone?: string | null
  /**
   * The bio of the staff member.
   */
  bio?: string | null
  /**
   * The avatar URL of the staff member.
   */
  avatar_url?: string | null
  /**
   * Whether the staff member is active.
   */
  is_active?: boolean
  /**
   * Custom metadata for the staff member.
   */
  metadata?: Record<string, unknown> | null
}

// -------------------- Availability Rule Mutations --------------------

/**
 * The data to create an availability rule.
 */
export interface CreateAvailabilityRuleDTO {
  /**
   * The ID of the staff member this rule belongs to.
   */
  staff_id: string
  /**
   * The type of the rule.
   */
  rule_type?: RuleType
  /**
   * The day of the week for recurring rules.
   */
  day_of_week?: DayOfWeek | null
  /**
   * The specific date for specific rules.
   */
  specific_date?: Date | string | null
  /**
   * The start time in HH:MM format.
   */
  start_time: string
  /**
   * The end time in HH:MM format.
   */
  end_time: string
  /**
   * Whether the staff is available during this time.
   */
  is_available?: boolean
  /**
   * Custom metadata for the rule.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update an availability rule.
 */
export interface UpdateAvailabilityRuleDTO {
  /**
   * The ID of the rule to update.
   */
  id: string
  /**
   * The type of the rule.
   */
  rule_type?: RuleType
  /**
   * The day of the week for recurring rules.
   */
  day_of_week?: DayOfWeek | null
  /**
   * The specific date for specific rules.
   */
  specific_date?: Date | string | null
  /**
   * The start time in HH:MM format.
   */
  start_time?: string
  /**
   * The end time in HH:MM format.
   */
  end_time?: string
  /**
   * Whether the staff is available during this time.
   */
  is_available?: boolean
  /**
   * Custom metadata for the rule.
   */
  metadata?: Record<string, unknown> | null
}

// -------------------- Booking Settings Mutations --------------------

/**
 * The data to update booking settings.
 */
export interface UpdateBookingSettingsDTO {
  /**
   * Whether guest bookings are allowed.
   */
  allow_guest_bookings?: boolean
  /**
   * The default hold duration in minutes.
   */
  default_hold_duration_minutes?: number
  /**
   * The cancellation window in hours.
   */
  cancellation_window_hours?: number
  /**
   * The timezone for the booking system.
   */
  timezone?: string
  /**
   * Custom metadata for the settings.
   */
  metadata?: Record<string, unknown> | null
}

// -------------------- Booking Mutations --------------------

/**
 * The data to create a booking.
 */
export interface CreateBookingDTO {
  /**
   * The ID of the staff member.
   */
  staff_id: string
  /**
   * The ID of the service.
   */
  service_id: string
  /**
   * The ID of the customer.
   */
  customer_id?: string | null
  /**
   * The start time of the booking.
   */
  start_at: Date | string
  /**
   * The end time of the booking.
   */
  end_at: Date | string
  /**
   * The status of the booking.
   */
  status?: BookingStatus
  /**
   * When the hold expires.
   */
  hold_expires_at?: Date | string | null
  /**
   * The name of the service at time of booking.
   */
  service_name: string
  /**
   * The price amount.
   */
  price_amount: BigNumberInput
  /**
   * The currency code.
   */
  currency_code: string
  /**
   * The deposit amount.
   */
  deposit_amount?: BigNumberInput | null
  /**
   * The payment mode used.
   */
  payment_mode?: PaymentMode | null
  /**
   * The amount paid.
   */
  amount_paid?: BigNumberInput | null
  /**
   * The customer's email.
   */
  customer_email?: string | null
  /**
   * The customer's phone.
   */
  customer_phone?: string | null
  /**
   * The customer's name.
   */
  customer_name?: string | null
  /**
   * Notes for the booking.
   */
  notes?: string | null
  /**
   * Internal notes (staff only).
   */
  internal_notes?: string | null
  /**
   * Custom metadata for the booking.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a booking.
 */
export interface UpdateBookingDTO {
  /**
   * The ID of the booking to update.
   */
  id: string
  /**
   * The status of the booking.
   */
  status?: BookingStatus
  /**
   * When the hold expires.
   */
  hold_expires_at?: Date | string | null
  /**
   * The payment mode used.
   */
  payment_mode?: PaymentMode | null
  /**
   * The amount paid.
   */
  amount_paid?: BigNumberInput | null
  /**
   * The customer's email.
   */
  customer_email?: string | null
  /**
   * The customer's phone.
   */
  customer_phone?: string | null
  /**
   * The customer's name.
   */
  customer_name?: string | null
  /**
   * Notes for the booking.
   */
  notes?: string | null
  /**
   * Internal notes (staff only).
   */
  internal_notes?: string | null
  /**
   * When the booking was confirmed.
   */
  confirmed_at?: Date | string | null
  /**
   * When the booking was cancelled.
   */
  cancelled_at?: Date | string | null
  /**
   * When the booking was completed.
   */
  completed_at?: Date | string | null
  /**
   * Custom metadata for the booking.
   */
  metadata?: Record<string, unknown> | null
}
