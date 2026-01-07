import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for validating the cancellation window.
 */
export interface ValidateCancellationWindowStepInput {
  /**
   * The start time of the booking.
   */
  booking_start_at: Date | string
  /**
   * Whether this is an admin cancellation (bypasses window check).
   */
  is_admin: boolean
  /**
   * The cancellation window in hours before the booking start time.
   */
  cancellation_window_hours: number
}

export const validateCancellationWindowStepId = "validate-cancellation-window"

/**
 * This step validates that a booking can be cancelled based on the cancellation window.
 *
 * - Admin users can always cancel (bypasses the window check)
 * - Customers must cancel at least X hours before the booking start time
 *
 * @example
 * validateCancellationWindowStep({
 *   booking_start_at: new Date("2025-01-15T10:00:00"),
 *   is_admin: false,
 *   cancellation_window_hours: 2,
 * })
 */
export const validateCancellationWindowStep = createStep(
  validateCancellationWindowStepId,
  async (input: ValidateCancellationWindowStepInput) => {
    // Admin can always cancel
    if (input.is_admin) {
      return new StepResponse({ canCancel: true })
    }

    const now = new Date()
    const bookingStart = new Date(input.booking_start_at)
    const hoursUntilBooking =
      (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilBooking < input.cancellation_window_hours) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Bookings can only be cancelled at least ${input.cancellation_window_hours} hours in advance. ` +
          `This booking starts in ${Math.max(0, Math.floor(hoursUntilBooking))} hours.`
      )
    }

    return new StepResponse({ canCancel: true })
  }
)
