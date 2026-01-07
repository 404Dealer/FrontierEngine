import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminUpdateStaffType } from "../../validators"

/**
 * @oas [get] /admin/bookings/staff/{id}
 * summary: Get a Staff Member
 * description: Retrieves a staff member by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Staff
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const staff = await bookingModule.retrieveBookingStaff(id, {
    select: req.queryConfig.fields as string[],
  })

  res.json({
    staff,
  })
}

/**
 * @oas [post] /admin/bookings/staff/{id}
 * summary: Update a Staff Member
 * description: Updates a staff member by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Staff
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateStaffType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const staff = await bookingModule.updateBookingStaffs({
    id,
    ...req.validatedBody,
  })

  res.json({
    staff,
  })
}

/**
 * @oas [delete] /admin/bookings/staff/{id}
 * summary: Delete a Staff Member
 * description: Deletes a staff member by ID.
 * x-authenticated: true
 * tags:
 *   - Booking Staff
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  await bookingModule.deleteBookingStaffs(id)

  res.status(200).json({
    id,
    object: "booking_staff",
    deleted: true,
  })
}
