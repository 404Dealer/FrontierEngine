import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateStaffType,
  AdminGetStaffsParamsType,
} from "../validators"

/**
 * @oas [get] /admin/bookings/staff
 * summary: List Booking Staff
 * description: Lists all staff members with optional filtering.
 * x-authenticated: true
 * tags:
 *   - Booking Staff
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetStaffsParamsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const [staff, count] = await bookingModule.listAndCountBookingStaffs(
    req.filterableFields,
    {
      skip: req.queryConfig.pagination?.skip,
      take: req.queryConfig.pagination?.take,
      select: req.queryConfig.fields as string[],
    }
  )

  res.json({
    staff,
    count,
    offset: req.queryConfig.pagination?.skip ?? 0,
    limit: req.queryConfig.pagination?.take ?? 50,
  })
}

/**
 * @oas [post] /admin/bookings/staff
 * summary: Create a Staff Member
 * description: Creates a new staff member.
 * x-authenticated: true
 * tags:
 *   - Booking Staff
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateStaffType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const staffMember = await bookingModule.createBookingStaffs(req.validatedBody)

  res.status(201).json({
    staff: staffMember,
  })
}
