import { IBookingModuleService } from "@medusajs/framework/types"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { StoreGetAvailabilityParamsType } from "../validators"

/**
 * @oas [get] /store/bookings/availability
 * operationId: GetStoreBookingsAvailability
 * summary: Get Available Time Slots
 * description: Retrieves available time slots for a specific date and service.
 * x-authenticated: false
 * parameters:
 *   - name: date
 *     in: query
 *     description: The date to check availability for (YYYY-MM-DD format).
 *     required: true
 *     schema:
 *       type: string
 *       pattern: "^\\d{4}-\\d{2}-\\d{2}$"
 *   - name: service_id
 *     in: query
 *     description: The ID of the service to check availability for.
 *     required: true
 *     schema:
 *       type: string
 *   - name: staff_id
 *     in: query
 *     description: Optional staff member ID to filter availability.
 *     schema:
 *       type: string
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             slots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   start_at:
 *                     type: string
 *                     format: date-time
 *                   end_at:
 *                     type: string
 *                     format: date-time
 *                   staff_id:
 *                     type: string
 *                   staff_name:
 *                     type: string
 *                   service_id:
 *                     type: string
 */
export const GET = async (
  req: MedusaRequest<StoreGetAvailabilityParamsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const { date, service_id, staff_id } =
    req.validatedQuery as StoreGetAvailabilityParamsType

  const slots = await bookingModule.getAvailableSlots({
    date,  // Pass string directly - ensureDate() handles parsing as local timezone
    service_id,
    staff_id,
  })

  res.json({ slots })
}
