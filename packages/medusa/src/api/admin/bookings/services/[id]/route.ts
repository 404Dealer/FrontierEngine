import {
  IBookingModuleService,
  UpdateServiceDTO,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminUpdateServiceType } from "../../validators"

/**
 * @oas [get] /admin/bookings/services/{id}
 * summary: Get a Booking Service
 * description: Retrieves a booking service by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Services
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const service = await bookingModule.retrieveBookingService(id, {
    select: req.queryConfig.fields as string[],
  })

  res.json({
    service,
  })
}

/**
 * @oas [post] /admin/bookings/services/{id}
 * summary: Update a Booking Service
 * description: Updates a booking service by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Services
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateServiceType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const service = await bookingModule.updateBookingServices({
    id,
    ...req.validatedBody,
  } as UpdateServiceDTO)

  res.json({
    service,
  })
}

/**
 * @oas [delete] /admin/bookings/services/{id}
 * summary: Delete a Booking Service
 * description: Deletes a booking service by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Services
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  await bookingModule.deleteBookingServices(id)

  res.status(200).json({
    id,
    object: "booking_service",
    deleted: true,
  })
}
