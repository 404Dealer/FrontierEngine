import type { BaseFilterable, OperatorMap } from "../dal"
import type { BigNumberInput } from "../totals"

/**
 * Enum for deposit types on a service.
 */
export enum DepositType {
  NONE = "none",
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

/**
 * Enum for allowed payment modes on a service.
 */
export enum PaymentModeAllowed {
  IN_PERSON = "in_person",
  ONLINE = "online",
}

/**
 * Enum for days of the week in availability rules.
 * Uses numeric values (Monday=0 through Sunday=6) to match the model.
 */
export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

/**
 * Enum for availability rule types.
 */
export enum RuleType {
  RECURRING = "recurring",
  EXCEPTION = "exception",
  BLOCKED = "blocked",
}

/**
 * Enum for booking statuses.
 */
export enum BookingStatus {
  PENDING = "pending",
  HELD = "held",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

/**
 * Enum for payment modes on a booking.
 * Determines how the customer will pay for the booking.
 */
export enum PaymentMode {
  PAY_IN_STORE = "pay_in_store",
  DEPOSIT = "deposit",
  FULL = "full",
}

// -------------------- Service DTOs --------------------

/**
 * A service's data.
 */
export interface ServiceDTO {
  /**
   * The ID of the service.
   */
  id: string
  /**
   * The name of the service.
   */
  name: string
  /**
   * The description of the service.
   */
  description: string | null
  /**
   * The duration of the service in minutes.
   */
  duration_minutes: number
  /**
   * The buffer time after the service in minutes.
   */
  buffer_minutes: number
  /**
   * The price of the service.
   */
  price: BigNumberInput
  /**
   * The currency code of the price.
   */
  currency_code: string
  /**
   * The ID of the region this service operates in.
   * Used for cart creation with proper currency/tax calculation.
   */
  region_id: string | null
  /**
   * The deposit type for the service.
   */
  deposit_type: DepositType
  /**
   * The deposit value (percentage or fixed amount).
   */
  deposit_value: BigNumberInput | null
  /**
   * The payment modes allowed for this service.
   */
  payment_modes_allowed: PaymentModeAllowed[]
  /**
   * Whether the service is active.
   */
  is_active: boolean
  /**
   * Custom metadata for the service.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the service was created.
   */
  created_at: Date
  /**
   * When the service was last updated.
   */
  updated_at: Date
  /**
   * When the service was deleted.
   */
  deleted_at: Date | null
}

/**
 * Filters for querying services.
 */
export type FilterableServiceProps = BaseFilterable<ServiceDTO> & {
  /**
   * Filter by ID.
   */
  id?: string | string[] | OperatorMap<string>
  /**
   * Filter by name.
   */
  name?: string | OperatorMap<string>
  /**
   * Filter by active status.
   */
  is_active?: boolean
  /**
   * Filter by currency code.
   */
  currency_code?: string | string[]
}

// -------------------- Staff DTOs --------------------

/**
 * A staff member's data.
 */
export interface StaffDTO {
  /**
   * The ID of the staff member.
   */
  id: string
  /**
   * The name of the staff member.
   */
  name: string
  /**
   * The email of the staff member.
   */
  email: string | null
  /**
   * The phone number of the staff member.
   */
  phone: string | null
  /**
   * The bio of the staff member.
   */
  bio: string | null
  /**
   * The avatar URL of the staff member.
   */
  avatar_url: string | null
  /**
   * Whether the staff member is active.
   */
  is_active: boolean
  /**
   * Custom metadata for the staff member.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the staff member was created.
   */
  created_at: Date
  /**
   * When the staff member was last updated.
   */
  updated_at: Date
  /**
   * When the staff member was deleted.
   */
  deleted_at: Date | null
}

/**
 * Filters for querying staff members.
 */
export type FilterableStaffProps = BaseFilterable<StaffDTO> & {
  /**
   * Filter by ID.
   */
  id?: string | string[] | OperatorMap<string>
  /**
   * Filter by name.
   */
  name?: string | OperatorMap<string>
  /**
   * Filter by email.
   */
  email?: string | OperatorMap<string>
  /**
   * Filter by active status.
   */
  is_active?: boolean
}

// -------------------- Availability Rule DTOs --------------------

/**
 * An availability rule's data.
 */
export interface AvailabilityRuleDTO {
  /**
   * The ID of the availability rule.
   */
  id: string
  /**
   * The ID of the staff member this rule belongs to.
   */
  staff_id: string
  /**
   * The type of the rule.
   */
  rule_type: RuleType
  /**
   * The day of the week for recurring rules (0=Monday through 6=Sunday).
   */
  day_of_week: number | null
  /**
   * The specific date for specific rules.
   */
  specific_date: Date | null
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
  is_available: boolean
  /**
   * Custom metadata for the rule.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the rule was created.
   */
  created_at: Date
  /**
   * When the rule was last updated.
   */
  updated_at: Date
  /**
   * When the rule was deleted.
   */
  deleted_at: Date | null
}

/**
 * Filters for querying availability rules.
 */
export type FilterableAvailabilityRuleProps =
  BaseFilterable<AvailabilityRuleDTO> & {
    /**
     * Filter by ID.
     */
    id?: string | string[] | OperatorMap<string>
    /**
     * Filter by staff ID.
     */
    staff_id?: string | string[]
    /**
     * Filter by rule type.
     */
    rule_type?: RuleType | RuleType[]
    /**
     * Filter by day of week.
     */
    day_of_week?: DayOfWeek | DayOfWeek[]
    /**
     * Filter by availability status.
     */
    is_available?: boolean
  }

// -------------------- Booking Settings DTOs --------------------

/**
 * Booking settings data.
 */
export interface BookingSettingsDTO {
  /**
   * The ID of the settings.
   */
  id: string
  /**
   * Whether guest bookings are allowed.
   */
  allow_guest_bookings: boolean
  /**
   * The default hold duration in minutes.
   */
  default_hold_duration_minutes: number
  /**
   * The cancellation window in hours.
   */
  cancellation_window_hours: number
  /**
   * The timezone for the booking system.
   */
  timezone: string
  /**
   * Custom metadata for the settings.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the settings were created.
   */
  created_at: Date
  /**
   * When the settings were last updated.
   */
  updated_at: Date
  /**
   * When the settings were deleted.
   */
  deleted_at: Date | null
}

// -------------------- Booking DTOs --------------------

/**
 * A booking's data.
 */
export interface BookingDTO {
  /**
   * The ID of the booking.
   */
  id: string
  /**
   * The display ID of the booking.
   */
  display_id: number
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
  customer_id: string | null
  /**
   * The start time of the booking.
   */
  start_at: Date
  /**
   * The end time of the booking.
   */
  end_at: Date
  /**
   * The status of the booking.
   */
  status: BookingStatus
  /**
   * When the hold expires.
   */
  hold_expires_at: Date | null
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
  deposit_amount: BigNumberInput | null
  /**
   * The payment mode used.
   */
  payment_mode: PaymentMode | null
  /**
   * The amount paid.
   */
  amount_paid: BigNumberInput | null
  /**
   * The customer's email.
   */
  customer_email: string | null
  /**
   * The customer's phone.
   */
  customer_phone: string | null
  /**
   * The customer's name.
   */
  customer_name: string | null
  /**
   * Notes for the booking.
   */
  notes: string | null
  /**
   * Internal notes (staff only).
   */
  internal_notes: string | null
  /**
   * When the booking was confirmed.
   */
  confirmed_at: Date | null
  /**
   * When the booking was cancelled.
   */
  cancelled_at: Date | null
  /**
   * When the booking was completed.
   */
  completed_at: Date | null
  /**
   * Custom metadata for the booking.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the booking was created.
   */
  created_at: Date
  /**
   * When the booking was last updated.
   */
  updated_at: Date
  /**
   * When the booking was deleted.
   */
  deleted_at: Date | null
}

/**
 * Filters for querying bookings.
 */
export type FilterableBookingProps = BaseFilterable<BookingDTO> & {
  /**
   * Filter by ID.
   */
  id?: string | string[] | OperatorMap<string>
  /**
   * Filter by display ID.
   */
  display_id?: number | OperatorMap<number>
  /**
   * Filter by staff ID.
   */
  staff_id?: string | string[]
  /**
   * Filter by service ID.
   */
  service_id?: string | string[]
  /**
   * Filter by customer ID.
   */
  customer_id?: string | string[] | null
  /**
   * Filter by status.
   */
  status?: BookingStatus | BookingStatus[]
  /**
   * Filter by start time.
   */
  start_at?: Date | OperatorMap<Date>
  /**
   * Filter by end time.
   */
  end_at?: Date | OperatorMap<Date>
  /**
   * Filter by customer email.
   */
  customer_email?: string | OperatorMap<string>
  /**
   * Filter by hold expiration time.
   */
  hold_expires_at?: Date | OperatorMap<Date> | null
}

// -------------------- Availability DTOs --------------------

/**
 * An available time slot.
 */
export interface AvailableSlotDTO {
  /**
   * The start time of the slot.
   */
  start_at: Date
  /**
   * The end time of the slot.
   */
  end_at: Date
  /**
   * The ID of the staff member who is available.
   */
  staff_id: string
  /**
   * The name of the staff member.
   */
  staff_name: string
  /**
   * The ID of the service this slot is for.
   */
  service_id: string
}

/**
 * Input for getting available slots.
 */
export interface GetAvailableSlotsInput {
  /**
   * The date to check availability for.
   * Can be a Date object or a YYYY-MM-DD string (parsed as local timezone).
   */
  date: Date | string
  /**
   * The ID of the service to check availability for.
   */
  service_id: string
  /**
   * Optional: The ID of a specific staff member to check.
   * If omitted, returns slots for all active staff.
   */
  staff_id?: string
}

/**
 * Input for checking if a specific slot is available.
 */
export interface CheckSlotAvailabilityInput {
  /**
   * The ID of the staff member.
   */
  staff_id: string
  /**
   * The start time of the slot.
   */
  start_at: Date
  /**
   * The end time of the slot.
   */
  end_at: Date
}
