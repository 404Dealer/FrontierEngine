import { IBookingModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const validateBookingForConfirmationStepId =
  "validate-booking-for-confirmation"

/**
 * This step validates that a booking can be confirmed.
 * It checks that the booking exists, is in "held" status, and hasn't expired.
 *
 * @example
 * validateBookingForConfirmationStep("book_123")
 */
export const validateBookingForConfirmationStep = createStep(
  { name: validateBookingForConfirmationStepId, noCompensation: true },
  async (bookingId: string, { container }) => {
    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    const booking = await bookingModule.retrieveBookingRecord(bookingId)

    if (!booking) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Booking with id: ${bookingId} was not found`
      )
    }

    if (booking.status !== "held") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Booking is not in held status. Current status: ${booking.status}`
      )
    }

    if (
      booking.hold_expires_at &&
      new Date(booking.hold_expires_at) < new Date()
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The hold on this booking has expired"
      )
    }

    return new StepResponse(booking)
  }
)
