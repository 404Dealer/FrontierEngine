import {
  CreateBookingDTO,
  IBookingModuleService,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateBookingType,
  AdminGetBookingsParamsType,
} from "./validators"

/**
 * @oas [get] /admin/bookings
 * summary: List Bookings
 * description: Lists all bookings with optional filtering.
 * x-authenticated: true
 * tags:
 *   - Bookings
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetBookingsParamsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const [bookings, count] = await bookingModule.listAndCountBookingRecords(
    req.filterableFields,
    {
      skip: req.queryConfig.pagination?.skip,
      take: req.queryConfig.pagination?.take,
      select: req.queryConfig.fields as string[],
    }
  )

  res.json({
    bookings,
    count,
    offset: req.queryConfig.pagination?.skip ?? 0,
    limit: req.queryConfig.pagination?.take ?? 20,
  })
}

/**
 * @oas [post] /admin/bookings
 * summary: Create a Booking
 * description: Creates a new booking.
 * x-authenticated: true
 * tags:
 *   - Bookings
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateBookingType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const booking = await bookingModule.createBookingRecords(
    req.validatedBody as CreateBookingDTO
  )

  res.status(201).json({
    booking,
  })
}
