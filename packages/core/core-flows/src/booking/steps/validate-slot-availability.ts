import { IBookingModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for validating slot availability.
 */
export type ValidateSlotAvailabilityStepInput = {
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

export const validateSlotAvailabilityStepId = "validate-slot-availability"

/**
 * This step validates that a time slot is available for booking.
 * It checks staff availability rules and existing bookings.
 *
 * @example
 * validateSlotAvailabilityStep({
 *   staff_id: "bkstf_123",
 *   start_at: new Date("2025-01-15T10:00:00"),
 *   end_at: new Date("2025-01-15T10:30:00"),
 * })
 */
export const validateSlotAvailabilityStep = createStep(
  { name: validateSlotAvailabilityStepId, noCompensation: true },
  async (input: ValidateSlotAvailabilityStepInput, { container }) => {
    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    const isAvailable = await bookingModule.checkSlotAvailability({
      staff_id: input.staff_id,
      start_at: input.start_at,
      end_at: input.end_at,
    })

    if (!isAvailable) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The requested time slot is not available"
      )
    }

    return new StepResponse({ validated: true })
  }
)
