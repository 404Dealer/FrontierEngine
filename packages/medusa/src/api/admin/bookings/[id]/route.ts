import {
  IBookingModuleService,
  UpdateBookingDTO,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminUpdateBookingType } from "../validators"

/**
 * @oas [get] /admin/bookings/{id}
 * summary: Get a Booking
 * description: Retrieves a booking by ID.
 * x-authenticated: true
 * tags:
 *   - Bookings
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const booking = await bookingModule.retrieveBookingRecord(id, {
    select: req.queryConfig.fields as string[],
  })

  res.json({
    booking,
  })
}

/**
 * @oas [post] /admin/bookings/{id}
 * summary: Update a Booking
 * description: Updates a booking by ID.
 * x-authenticated: true
 * tags:
 *   - Bookings
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBookingType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const booking = await bookingModule.updateBookingRecords({
    id,
    ...req.validatedBody,
  } as UpdateBookingDTO)

  res.json({
    booking,
  })
}

/**
 * @oas [delete] /admin/bookings/{id}
 * summary: Delete a Booking
 * description: Deletes a booking by ID.
 * x-authenticated: true
 * tags:
 *   - Bookings
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  await bookingModule.deleteBookingRecords(id)

  res.status(200).json({
    id,
    object: "booking",
    deleted: true,
  })
}
