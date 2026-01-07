import { BookingDTO, BookingStatus } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { cancelOrderWorkflow } from "../../order/workflows/cancel-order"
import {
  updateBookingStep,
  validateCancellationWindowStep,
} from "../steps"

/**
 * The input for cancelling a booking.
 */
export type CancelBookingWorkflowInput = {
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

export const cancelBookingWorkflowId = "cancel-booking"

/**
 * This workflow cancels a booking.
 *
 * - Validates the cancellation window (customers must cancel X hours in advance)
 * - If the booking has a linked order, cancels the order (triggers refund)
 * - Updates the booking status to CANCELLED
 *
 * Admin users can bypass the cancellation window check.
 *
 * @example
 * const { result } = await cancelBookingWorkflow(container).run({
 *   input: {
 *     booking_id: "book_123",
 *     reason: "Customer requested cancellation",
 *     is_admin: false,
 *   },
 * })
 *
 * @summary
 *
 * Cancel a booking with optional refund.
 */
export const cancelBookingWorkflow = createWorkflow(
  cancelBookingWorkflowId,
  (input: WorkflowData<CancelBookingWorkflowInput>) => {
    // 1. Get booking details with linked order
    const bookingQuery = useQueryGraphStep({
      entity: "booking",
      fields: [
        "id",
        "status",
        "start_at",
        "payment_mode",
        "order.id",
        "order.status",
      ],
      filters: { id: input.booking_id },
    }).config({ name: "get-booking-with-order" })

    // 2. Get booking settings for cancellation window
    const settingsQuery = useQueryGraphStep({
      entity: "booking_settings",
      fields: ["cancellation_window_hours"],
    }).config({ name: "get-booking-settings" })

    // 3. Validate cancellation window
    const windowInput = transform(
      { bookingQuery, settingsQuery, input },
      (data) => ({
        booking_start_at: data.bookingQuery.data[0]?.start_at,
        is_admin: data.input.is_admin ?? false,
        cancellation_window_hours:
          data.settingsQuery.data[0]?.cancellation_window_hours ?? 2,
      })
    )

    validateCancellationWindowStep(windowInput)

    // 4. If order exists, cancel the order (triggers refund)
    when(
      { bookingQuery },
      (data) => !!data.bookingQuery.data[0]?.order?.id
    ).then(() => {
      const orderInput = transform({ bookingQuery, input }, (data) => ({
        order_id: data.bookingQuery.data[0].order.id,
        canceled_by: data.input.cancelled_by,
      }))

      cancelOrderWorkflow.runAsStep({
        input: orderInput,
      })
    })

    // 5. Update booking to cancelled status
    const updateData = transform({ input }, (data) => ({
      id: data.input.booking_id,
      status: BookingStatus.CANCELLED,
      cancelled_at: new Date(),
    }))

    const cancelled = updateBookingStep(updateData).config({
      name: "update-booking-cancelled",
    })

    // 6. Hook for notifications
    const bookingCancelled = createHook("bookingCancelled", {
      booking: cancelled,
      reason: input.reason,
    })

    return new WorkflowResponse(cancelled as BookingDTO, {
      hooks: [bookingCancelled],
    })
  }
)
