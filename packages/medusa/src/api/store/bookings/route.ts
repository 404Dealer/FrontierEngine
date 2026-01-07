import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { holdBookingSlotWorkflow } from "@medusajs/core-flows"
import { StoreHoldBookingType } from "./validators"

/**
 * @oas [post] /store/bookings
 * operationId: PostStoreBookings
 * summary: Hold a Booking Slot
 * description: Creates a temporary hold on a booking slot. The hold expires after 10 minutes.
 * x-authenticated: false
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - staff_id
 *           - service_id
 *           - start_at
 *         properties:
 *           staff_id:
 *             type: string
 *             description: The ID of the staff member.
 *           service_id:
 *             type: string
 *             description: The ID of the service.
 *           start_at:
 *             type: string
 *             format: date-time
 *             description: The start time of the booking.
 *           customer_email:
 *             type: string
 *             description: Guest customer email.
 *           customer_phone:
 *             type: string
 *             description: Guest customer phone.
 *           customer_name:
 *             type: string
 *             description: Guest customer name.
 *           notes:
 *             type: string
 *             description: Additional notes.
 * responses:
 *   201:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             booking:
 *               $ref: "#/components/schemas/Booking"
 */
export const POST = async (
  req: MedusaRequest<StoreHoldBookingType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  // Get service to populate pricing snapshot
  const service = await bookingModule.retrieveBookingService(
    req.validatedBody.service_id
  )

  // Calculate end_at from service duration
  const startAt = new Date(req.validatedBody.start_at)
  const endAt = new Date(
    startAt.getTime() +
      (service.duration_minutes + service.buffer_minutes) * 60000
  )

  const { result } = await holdBookingSlotWorkflow(req.scope).run({
    input: {
      staff_id: req.validatedBody.staff_id,
      service_id: req.validatedBody.service_id,
      start_at: startAt,
      end_at: endAt,
      service_name: service.name,
      price_amount: Number(service.price),
      currency_code: service.currency_code,
      customer_id: (req as AuthenticatedMedusaRequest).auth_context?.actor_id,
      customer_email: req.validatedBody.customer_email,
      customer_phone: req.validatedBody.customer_phone,
      customer_name: req.validatedBody.customer_name,
      notes: req.validatedBody.notes,
    },
  })

  res.status(201).json({ booking: result })
}

/**
 * @oas [get] /store/bookings
 * operationId: GetStoreBookings
 * summary: List Customer Bookings
 * description: Lists all bookings for the authenticated customer.
 * x-authenticated: true
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             bookings:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Booking"
 *   401:
 *     description: Unauthorized
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)
  const bookings = await bookingModule.listBookingRecords({ customer_id: customerId })

  res.json({ bookings })
}
