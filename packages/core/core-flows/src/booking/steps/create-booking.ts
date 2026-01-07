import {
  CreateBookingDTO,
  IBookingModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for creating a booking.
 */
export type CreateBookingStepInput = CreateBookingDTO

export const createBookingStepId = "create-booking"

/**
 * This step creates a booking.
 *
 * @example
 * createBookingStep({
 *   staff_id: "bkstf_123",
 *   service_id: "bksvc_456",
 *   start_at: new Date("2025-01-15T10:00:00"),
 *   end_at: new Date("2025-01-15T10:30:00"),
 *   service_name: "Haircut",
 *   price_amount: 2500,
 *   currency_code: "usd",
 *   status: "held",
 * })
 */
export const createBookingStep = createStep(
  createBookingStepId,
  async (data: CreateBookingStepInput, { container }) => {
    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    const [booking] = await bookingModule.createBookingRecords([data])

    return new StepResponse(booking, booking.id)
  },
  async (bookingId, { container }) => {
    if (!bookingId) {
      return
    }

    const bookingModule = container.resolve<IBookingModuleService>(
      Modules.BOOKING
    )

    await bookingModule.deleteBookingRecords([bookingId])
  }
)
