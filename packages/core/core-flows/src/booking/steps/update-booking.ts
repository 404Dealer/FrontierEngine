import {
  IBookingModuleService,
  UpdateBookingDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for updating a booking.
 */
export type UpdateBookingStepInput = UpdateBookingDTO & {
  /**
   * The ID of the booking to update.
   */
  id: string
}

type CompensationData = {
  id: string
  original: Record<string, unknown>
}

export const updateBookingStepId = "update-booking"

/**
 * This step updates a booking.
 *
 * @example
 * updateBookingStep({
 *   id: "book_123",
 *   status: "confirmed",
 *   confirmed_at: new Date(),
 * })
 */
export const updateBookingStep = createStep(
  updateBookingStepId,
  async (data: UpdateBookingStepInput, { container }) => {
    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    // Get original for compensation
    const original = await bookingModule.retrieveBookingRecord(data.id)

    const [updated] = await bookingModule.updateBookingRecords([data])

    // Store fields that were changed for rollback
    const changedFields: Record<string, unknown> = {}
    const updateKeys = Object.keys(data).filter((k) => k !== "id")
    for (const key of updateKeys) {
      if (key in original) {
        changedFields[key] = (original as unknown as Record<string, unknown>)[key]
      }
    }

    return new StepResponse(updated, {
      id: data.id,
      original: changedFields,
    })
  },
  async (compensationData: CompensationData | undefined, { container }) => {
    if (!compensationData) {
      return
    }

    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    await bookingModule.updateBookingRecords([
      {
        id: compensationData.id,
        ...compensationData.original,
      },
    ])
  }
)
