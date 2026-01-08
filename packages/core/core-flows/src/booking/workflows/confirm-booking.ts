import {
  BookingDTO,
  BookingStatus,
  CartDTO,
  DepositType,
  PaymentMode,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import {
  createBookingCartStep,
  updateBookingStep,
  validateBookingForConfirmationStep,
} from "../steps"

/**
 * The input for confirming a booking.
 */
export type ConfirmBookingWorkflowInput = {
  /**
   * The ID of the booking to confirm.
   */
  booking_id: string
  /**
   * The payment mode for the booking.
   */
  payment_mode: PaymentMode
  /**
   * The ID of the customer (optional).
   */
  customer_id?: string
  /**
   * The email for the booking/cart.
   */
  email?: string
}

/**
 * The result of confirming a booking.
 */
export type ConfirmBookingWorkflowResult = {
  /**
   * The confirmed booking (for PAY_IN_STORE mode).
   */
  booking: BookingDTO | null
  /**
   * The cart ID for checkout (for DEPOSIT/FULL modes).
   */
  cart_id: string | null
}

export const confirmBookingWorkflowId = "confirm-booking"

/**
 * This workflow confirms a held booking or initiates payment.
 *
 * For PAY_IN_STORE: Updates booking to "confirmed" status immediately.
 * For DEPOSIT/FULL: Creates a cart with the appropriate amount for checkout.
 *                   Booking remains "held" until order is placed.
 *
 * @example
 * // PAY_IN_STORE - immediate confirmation
 * const { result } = await confirmBookingWorkflow(container).run({
 *   input: {
 *     booking_id: "book_123",
 *     payment_mode: "pay_in_store",
 *   },
 * })
 * // result.booking is the confirmed booking
 * // result.cart_id is null
 *
 * @example
 * // DEPOSIT or FULL - creates cart for checkout
 * const { result } = await confirmBookingWorkflow(container).run({
 *   input: {
 *     booking_id: "book_123",
 *     payment_mode: "deposit",
 *   },
 * })
 * // result.booking is null
 * // result.cart_id is the cart ID for checkout
 *
 * @summary
 *
 * Confirm a held booking or initiate payment flow.
 */
export const confirmBookingWorkflow = createWorkflow(
  confirmBookingWorkflowId,
  (input: WorkflowData<ConfirmBookingWorkflowInput>) => {
    // 1. Validate booking exists and is in HELD status
    validateBookingForConfirmationStep(input.booking_id)

    // 2. Get booking details
    const bookingQuery = useQueryGraphStep({
      entity: "booking_record",
      fields: [
        "id",
        "service_id",
        "service_name",
        "price_amount",
        "currency_code",
        "customer_email",
        "customer_id",
      ],
      filters: { id: input.booking_id },
    }).config({ name: "get-booking-details" })

    // 3. Get service details for deposit config and region
    const serviceQuery = useQueryGraphStep({
      entity: "booking_service",
      fields: ["id", "region_id", "deposit_type", "deposit_value"],
      filters: {
        id: transform({ bookingQuery }, (data) => {
          return data.bookingQuery.data[0]?.service_id
        }),
      },
    }).config({ name: "get-service-details" })

    // 4. PAY_IN_STORE: Confirm immediately
    const payInStoreResult = when(
      "pay-in-store-confirmation",
      { payment_mode: input.payment_mode },
      (data) => data.payment_mode === PaymentMode.PAY_IN_STORE
    ).then(() => {
      const updateData = transform({ input }, (data) => ({
        id: data.input.booking_id,
        status: BookingStatus.CONFIRMED,
        payment_mode: PaymentMode.PAY_IN_STORE,
        confirmed_at: new Date(),
        hold_expires_at: null,
      }))

      const confirmed = updateBookingStep(updateData)

      return transform({ confirmed }, (data) => ({
        booking: data.confirmed as BookingDTO,
        cart_id: null as string | null,
      }))
    })

    // 5. DEPOSIT/FULL: Create cart for checkout
    const paymentResult = when(
      "payment-checkout",
      { payment_mode: input.payment_mode },
      (data) =>
        data.payment_mode === PaymentMode.DEPOSIT ||
        data.payment_mode === PaymentMode.FULL
    ).then(() => {
      // Validate service has region configured
      const cartInput = transform(
        { input, bookingQuery, serviceQuery },
        (data) => {
          const booking = data.bookingQuery.data[0]
          const service = data.serviceQuery.data[0]

          if (!service?.region_id) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Service must have a region configured for online payments"
            )
          }

          return {
            booking_id: data.input.booking_id,
            payment_mode: data.input.payment_mode,
            region_id: service.region_id,
            currency_code: booking.currency_code,
            customer_id: data.input.customer_id ?? booking.customer_id,
            email: data.input.email ?? booking.customer_email,
            service_name: booking.service_name,
            price_amount: Number(booking.price_amount),
            deposit_type: (service.deposit_type as DepositType) ?? DepositType.NONE,
            deposit_value: service.deposit_value
              ? Number(service.deposit_value)
              : null,
          }
        }
      )

      const cart = createBookingCartStep(cartInput)

      // Update booking with payment mode (stays HELD until order placed)
      const updateData = transform({ input }, (data) => ({
        id: data.input.booking_id,
        payment_mode: data.input.payment_mode,
      }))

      updateBookingStep(updateData).config({ name: "update-booking-payment-mode" })

      return transform({ cart }, (data) => ({
        booking: null as BookingDTO | null,
        cart_id: (data.cart as CartDTO).id,
      }))
    })

    // 6. Merge results from conditional branches
    const result = transform(
      { payInStoreResult, paymentResult },
      (data): ConfirmBookingWorkflowResult => {
        // One of these will be defined based on which branch executed
        if (data.payInStoreResult) {
          return data.payInStoreResult as ConfirmBookingWorkflowResult
        }
        if (data.paymentResult) {
          return data.paymentResult as ConfirmBookingWorkflowResult
        }
        return { booking: null, cart_id: null }
      }
    )

    // 7. Hook for notifications
    const bookingPaymentInitiated = createHook("bookingPaymentInitiated", {
      booking_id: input.booking_id,
      payment_mode: input.payment_mode,
      cart_id: result.cart_id,
    })

    return new WorkflowResponse(result as ConfirmBookingWorkflowResult, {
      hooks: [bookingPaymentInitiated],
    })
  }
)
