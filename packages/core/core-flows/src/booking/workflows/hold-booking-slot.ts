import { BookingStatus } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "../../common"
import {
  createBookingStep,
  validateSlotAvailabilityStep,
} from "../steps"

/**
 * The input for holding a booking slot.
 */
export type HoldBookingSlotWorkflowInput = {
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
  start_at: Date
  /**
   * The end time of the booking.
   */
  end_at: Date
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

export const holdBookingSlotWorkflowId = "hold-booking-slot"

/**
 * This workflow creates a temporary hold on a booking slot.
 * The hold expires after a configured duration (default 10 minutes).
 *
 * @example
 * const { result } = await holdBookingSlotWorkflow(container).run({
 *   input: {
 *     staff_id: "bkstf_123",
 *     service_id: "bksvc_456",
 *     start_at: new Date("2025-01-15T10:00:00"),
 *     end_at: new Date("2025-01-15T10:30:00"),
 *     service_name: "Haircut",
 *     price_amount: 2500,
 *     currency_code: "usd",
 *   },
 * })
 *
 * @summary
 *
 * Create a temporary hold on a booking slot.
 */
export const holdBookingSlotWorkflow = createWorkflow(
  holdBookingSlotWorkflowId,
  (input: WorkflowData<HoldBookingSlotWorkflowInput>) => {
    // 1. Validate slot is available
    validateSlotAvailabilityStep({
      staff_id: input.staff_id,
      start_at: input.start_at,
      end_at: input.end_at,
    })

    // 2. Prepare booking data with hold expiration
    const bookingData = transform({ input }, (data) => ({
      staff_id: data.input.staff_id,
      service_id: data.input.service_id,
      start_at: data.input.start_at,
      end_at: data.input.end_at,
      service_name: data.input.service_name,
      price_amount: data.input.price_amount,
      currency_code: data.input.currency_code,
      customer_id: data.input.customer_id,
      customer_email: data.input.customer_email,
      customer_phone: data.input.customer_phone,
      customer_name: data.input.customer_name,
      notes: data.input.notes,
      status: BookingStatus.HELD,
      hold_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    }))

    // 3. Create the booking with HELD status
    const booking = createBookingStep(bookingData)

    // 4. Create customer-booking link if customer_id exists
    when(
      "create-customer-booking-link",
      { booking, customer_id: input.customer_id },
      (data) => !!data.customer_id
    ).then(() => {
      const linkData = transform({ booking, input }, (data) => [
        {
          [Modules.CUSTOMER]: {
            customer_id: data.input.customer_id!,
          },
          [Modules.BOOKING]: {
            booking_id: data.booking.id,
          },
        },
      ])

      createRemoteLinkStep(linkData)
    })

    // 5. Hook for extensibility (e.g., notifications)
    const bookingHeld = createHook("bookingHeld", {
      booking,
    })

    return new WorkflowResponse(booking, {
      hooks: [bookingHeld],
    })
  }
)
