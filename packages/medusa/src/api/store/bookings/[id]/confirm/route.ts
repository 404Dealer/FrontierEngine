import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { confirmBookingWorkflow } from "@medusajs/core-flows"
import { StoreConfirmBookingType } from "../../validators"

/**
 * @oas [post] /store/bookings/{id}/confirm
 * operationId: PostStoreBookingsIdConfirm
 * summary: Confirm a Booking
 * description: |
 *   Confirms a held booking with the specified payment mode.
 *
 *   For `pay_in_store` mode: The booking is confirmed immediately.
 *
 *   For `deposit` or `full` mode: A cart is created with the appropriate
 *   amount. The customer should complete checkout with the returned cart_id.
 *   The booking remains in "held" status until the order is placed.
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
 *         required:
 *           - payment_mode
 *         properties:
 *           payment_mode:
 *             type: string
 *             enum:
 *               - pay_in_store
 *               - deposit
 *               - full
 *             description: The payment mode for the booking.
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             booking:
 *               description: The confirmed booking (for pay_in_store mode) or null (for deposit/full).
 *               oneOf:
 *                 - $ref: "#/components/schemas/Booking"
 *                 - type: "null"
 *             cart_id:
 *               description: The cart ID to complete checkout (for deposit/full mode) or null (for pay_in_store).
 *               oneOf:
 *                 - type: string
 *                 - type: "null"
 *   400:
 *     description: Booking is not in held status or hold has expired
 *   404:
 *     description: Booking not found
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreConfirmBookingType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id

  const { result } = await confirmBookingWorkflow(req.scope).run({
    input: {
      booking_id: id,
      payment_mode: req.validatedBody.payment_mode,
      customer_id: customerId,
      email: undefined, // Will use booking's customer_email
    },
  })

  res.json({
    booking: result.booking,
    cart_id: result.cart_id,
  })
}
