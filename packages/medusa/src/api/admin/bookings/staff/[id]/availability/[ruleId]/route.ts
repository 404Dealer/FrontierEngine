import {
  IBookingModuleService,
  UpdateAvailabilityRuleDTO,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminUpdateAvailabilityRuleType } from "../../../../validators"

/**
 * @oas [get] /admin/bookings/staff/{id}/availability/{ruleId}
 * summary: Get Availability Rule
 * description: Retrieves a specific availability rule.
 * x-authenticated: true
 * tags:
 *   - Booking Availability
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, ruleId } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // Verify staff member exists
  await bookingModule.retrieveBookingStaff(id)

  const rule = await bookingModule.retrieveBookingAvailabilityRule(ruleId, {
    select: req.queryConfig.fields as string[],
  })

  res.json({
    rule,
  })
}

/**
 * @oas [post] /admin/bookings/staff/{id}/availability/{ruleId}
 * summary: Update Availability Rule
 * description: Updates an availability rule.
 * x-authenticated: true
 * tags:
 *   - Booking Availability
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateAvailabilityRuleType>,
  res: MedusaResponse
) => {
  const { id, ruleId } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // Verify staff member exists
  await bookingModule.retrieveBookingStaff(id)

  const body = req.validatedBody

  // Build update data with only provided fields (exclude undefined values)
  const updateData: UpdateAvailabilityRuleDTO = { id: ruleId }

  if (body.day_of_week !== undefined) {
    updateData.day_of_week = body.day_of_week
  }
  if (body.specific_date !== undefined) {
    updateData.specific_date = body.specific_date
  }
  if (body.start_time !== undefined && body.start_time !== null) {
    updateData.start_time = body.start_time
  }
  if (body.end_time !== undefined && body.end_time !== null) {
    updateData.end_time = body.end_time
  }
  if (body.is_available !== undefined) {
    updateData.is_available = body.is_available
  }
  if (body.metadata !== undefined) {
    updateData.metadata = body.metadata
  }

  const rule = await bookingModule.updateBookingAvailabilityRules(updateData)

  res.json({
    rule,
  })
}

/**
 * @oas [delete] /admin/bookings/staff/{id}/availability/{ruleId}
 * summary: Delete Availability Rule
 * description: Deletes an availability rule.
 * x-authenticated: true
 * tags:
 *   - Booking Availability
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, ruleId } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // Verify staff member exists
  await bookingModule.retrieveBookingStaff(id)

  await bookingModule.deleteBookingAvailabilityRules(ruleId)

  res.status(200).json({
    id: ruleId,
    object: "booking_availability_rule",
    deleted: true,
  })
}
