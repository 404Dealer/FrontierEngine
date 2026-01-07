import { PaymentMode } from "./common"

/**
 * The input for holding a booking slot.
 */
export interface HoldBookingSlotWorkflowInput {
  /**
   * The ID of the staff member.
   */
  staff_id: string
  /**
   * The ID of the service being booked.
   */
  service_id: string
  /**
   * The start time of the booking.
   */
  start_at: Date | string
  /**
   * The end time of the booking.
   */
  end_at: Date | string
  /**
   * The name of the service (snapshot).
   */
  service_name: string
  /**
   * The price amount (snapshot).
   */
  price_amount: number
  /**
   * The currency code (snapshot).
   */
  currency_code: string
  /**
   * The ID of the customer (optional for guest bookings).
   */
  customer_id?: string
  /**
   * The email of the customer (for guest bookings).
   */
  customer_email?: string
  /**
   * The phone number of the customer (for guest bookings).
   */
  customer_phone?: string
  /**
   * The name of the customer (for guest bookings).
   */
  customer_name?: string
  /**
   * Additional notes for the booking.
   */
  notes?: string
}

/**
 * The input for confirming a booking.
 */
export interface ConfirmBookingWorkflowInput {
  /**
   * The ID of the booking to confirm.
   */
  booking_id: string
  /**
   * The payment mode for the booking.
   */
  payment_mode: PaymentMode
  /**
   * The ID of the customer (optional).
   */
  customer_id?: string
  /**
   * The email for the booking/cart.
   */
  email?: string
}

/**
 * The input for cancelling a booking.
 */
export interface CancelBookingWorkflowInput {
  /**
   * The ID of the booking to cancel.
   */
  booking_id: string
  /**
   * The reason for cancellation (optional).
   */
  reason?: string
  /**
   * Whether this is an admin cancellation (bypasses cancellation window).
   */
  is_admin?: boolean
  /**
   * The ID of the user who cancelled the booking.
   */
  cancelled_by?: string
}
