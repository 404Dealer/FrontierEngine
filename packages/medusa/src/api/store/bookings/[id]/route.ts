import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

/**
 * @oas [get] /store/bookings/{id}
 * operationId: GetStoreBookingsId
 * summary: Get a Booking
 * description: |
 *   Retrieves a booking by its ID.
 *
 *   Authorization:
 *   - Guest bookings (no customer_id): Anyone with the booking ID can view
 *   - Customer bookings: Only the linked customer can view (requires auth)
 * x-authenticated: false
 * parameters:
 *   - name: id
 *     in: path
 *     description: The booking ID.
 *     required: true
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
 *             booking:
 *               $ref: "#/components/schemas/Booking"
 *   403:
 *     description: Not authorized to view this booking
 *   404:
 *     description: Booking not found
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id

  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)
  const booking = await bookingModule.retrieveBookingRecord(id)

  // Verify the customer owns this booking
  // Allow viewing if:
  // 1. Booking has a customer_id and it matches the authenticated user
  // 2. Booking has no customer_id (guest booking) - allow anyone with the booking ID
  if (booking.customer_id && booking.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Not authorized to view this booking"
    )
  }

  res.json({ booking })
}
