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

  // Transform the validated body to match the DTO types
  const updateData: UpdateAvailabilityRuleDTO = {
    id: ruleId,
    day_of_week: body.day_of_week ?? undefined,
    specific_date: body.specific_date ?? undefined,
    start_time: body.start_time ?? undefined,
    end_time: body.end_time ?? undefined,
    is_available: body.is_available,
    metadata: body.metadata ?? undefined,
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
