import {
  CreateAvailabilityRuleDTO,
  IBookingModuleService,
  RuleType,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateAvailabilityRuleType,
  AdminGetAvailabilityRulesParamsType,
} from "../../../validators"

/**
 * @oas [get] /admin/bookings/staff/{id}/availability
 * summary: List Availability Rules
 * description: Retrieves availability rules for a staff member.
 * x-authenticated: true
 * tags:
 *   - Booking Availability
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetAvailabilityRulesParamsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // First verify the staff member exists
  await bookingModule.retrieveBookingStaff(id)

  const [rules, count] = await bookingModule.listAndCountBookingAvailabilityRules(
    { staff_id: id, ...req.filterableFields },
    {
      select: req.queryConfig.fields as string[],
      skip: req.queryConfig.pagination?.skip,
      take: req.queryConfig.pagination?.take,
      order: req.queryConfig.pagination?.order,
    }
  )

  res.json({
    rules,
    count,
    offset: req.queryConfig.pagination?.skip || 0,
    limit: req.queryConfig.pagination?.take || 50,
  })
}

/**
 * @oas [post] /admin/bookings/staff/{id}/availability
 * summary: Create Availability Rule
 * description: Creates a new availability rule for a staff member.
 * x-authenticated: true
 * tags:
 *   - Booking Availability
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAvailabilityRuleType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // Verify the staff member exists
  await bookingModule.retrieveBookingStaff(id)

  const body = req.validatedBody

  // Transform the validated body to match the DTO types
  const ruleData: CreateAvailabilityRuleDTO = {
    staff_id: id,
    rule_type: body.rule_type as RuleType,
    day_of_week: body.day_of_week ?? undefined,
    specific_date: body.specific_date ?? undefined,
    start_time: body.start_time ?? "",
    end_time: body.end_time ?? "",
    is_available: body.is_available,
    metadata: body.metadata ?? undefined,
  }

  const rule = await bookingModule.createBookingAvailabilityRules(ruleData)

  res.status(201).json({
    rule,
  })
}
