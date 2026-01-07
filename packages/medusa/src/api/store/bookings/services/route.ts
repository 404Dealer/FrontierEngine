import { IBookingModuleService } from "@medusajs/framework/types"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { StoreGetServicesParamsType } from "../validators"

/**
 * @oas [get] /store/bookings/services
 * operationId: GetStoreBookingsServices
 * summary: List Active Booking Services
 * description: Retrieves a list of active booking services.
 * x-authenticated: false
 * parameters:
 *   - name: limit
 *     in: query
 *     description: The number of services to return.
 *     schema:
 *       type: number
 *       default: 50
 *   - name: offset
 *     in: query
 *     description: The number of services to skip.
 *     schema:
 *       type: number
 *       default: 0
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             services:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/BookingService"
 *             count:
 *               type: number
 *             offset:
 *               type: number
 *             limit:
 *               type: number
 */
export const GET = async (
  req: MedusaRequest<StoreGetServicesParamsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const { limit, offset } = req.validatedQuery as StoreGetServicesParamsType

  const [services, count] = await bookingModule.listAndCountBookingServices(
    { is_active: true },
    {
      skip: offset,
      take: limit,
    }
  )

  res.json({
    services,
    count,
    offset,
    limit,
  })
}
