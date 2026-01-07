import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { cancelBookingWorkflow } from "@medusajs/core-flows"
import { StoreCancelBookingType } from "../../validators"

/**
 * @oas [post] /store/bookings/{id}/cancel
 * operationId: PostStoreBookingsIdCancel
 * summary: Cancel a Booking
 * description: |
 *   Cancels a booking. Customers must cancel at least X hours before
 *   the booking start time (configured via booking settings).
 *
 *   If the booking has a linked order (payment was made), the order
 *   will be cancelled and a refund will be initiated.
 * x-authenticated: false
 * parameters:
 *   - name: id
 *     in: path
 *     description: The booking ID.
 *     required: true
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           reason:
 *             type: string
 *             description: The reason for cancellation (optional).
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             booking:
 *               $ref: "#/components/schemas/Booking"
 *   400:
 *     description: Cancellation not allowed (past cancellation window)
 *   403:
 *     description: Not authorized to cancel this booking
 *   404:
 *     description: Booking not found
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCancelBookingType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id

  // Get booking to verify ownership
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)
  const booking = await bookingModule.retrieveBookingRecord(id)

  // Verify the customer owns this booking
  // Allow cancellation if:
  // 1. Booking has a customer_id and it matches the authenticated user
  // 2. Booking has no customer_id (guest booking) - allow anyone with the booking ID
  if (booking.customer_id && booking.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Not authorized to cancel this booking"
    )
  }

  const { result } = await cancelBookingWorkflow(req.scope).run({
    input: {
      booking_id: id,
      reason: req.validatedBody?.reason,
      is_admin: false,
      cancelled_by: customerId,
    },
  })

  res.json({ booking: result })
}
