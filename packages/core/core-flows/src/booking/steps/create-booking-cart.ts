import type { ICartModuleService } from "@medusajs/framework/types"
import { DepositType, PaymentMode } from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for creating a booking cart.
 */
export interface CreateBookingCartStepInput {
  /**
   * The ID of the booking.
   */
  booking_id: string
  /**
   * The payment mode (DEPOSIT or FULL).
   */
  payment_mode: PaymentMode
  /**
   * The ID of the region for the cart.
   */
  region_id: string
  /**
   * The currency code.
   */
  currency_code: string
  /**
   * The ID of the customer.
   */
  customer_id?: string
  /**
   * The email for the cart.
   */
  email?: string
  /**
   * The name of the service.
   */
  service_name: string
  /**
   * The full price of the service.
   */
  price_amount: number
  /**
   * The deposit type (NONE, FIXED, PERCENTAGE).
   */
  deposit_type: DepositType
  /**
   * The deposit value (amount or percentage).
   */
  deposit_value?: number | null
}

export const createBookingCartStepId = "create-booking-cart"

/**
 * This step creates a cart for a booking payment.
 * It calculates the correct amount based on payment mode
 * (deposit or full) and creates a cart with a line item.
 */
export const createBookingCartStep = createStep(
  createBookingCartStepId,
  async (input: CreateBookingCartStepInput, { container }) => {
    const cartModule = container.resolve<ICartModuleService>(Modules.CART)

    // Calculate line item amount based on payment mode
    let lineItemAmount: number

    if (input.payment_mode === PaymentMode.DEPOSIT) {
      // For deposit mode, calculate based on deposit_type
      if (input.deposit_type === DepositType.FIXED) {
        lineItemAmount = Number(input.deposit_value ?? input.price_amount)
      } else if (input.deposit_type === DepositType.PERCENTAGE) {
        const percentage = input.deposit_value ?? 0
        lineItemAmount = MathBN.convert(
          MathBN.mult(
            MathBN.div(percentage, 100),
            input.price_amount
          )
        ).toNumber()
      } else {
        // DepositType.NONE - shouldn't happen for deposit mode
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Deposit payment requires service to have deposit configured"
        )
      }
    } else if (input.payment_mode === PaymentMode.FULL) {
      // Full payment - use the full price
      lineItemAmount = input.price_amount
    } else {
      // PAY_IN_STORE shouldn't reach this step
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PAY_IN_STORE payment mode does not require cart creation"
      )
    }

    // Create cart with booking line item
    const [cart] = await cartModule.createCarts([
      {
        region_id: input.region_id,
        currency_code: input.currency_code,
        customer_id: input.customer_id,
        email: input.email,
        items: [
          {
            title: input.service_name,
            quantity: 1,
            unit_price: lineItemAmount,
            metadata: {
              booking_id: input.booking_id,
              payment_mode: input.payment_mode,
            },
          },
        ],
      },
    ])

    return new StepResponse(cart, cart.id)
  },
  async (cartId, { container }) => {
    if (!cartId) {
      return
    }

    const cartModule = container.resolve<ICartModuleService>(Modules.CART)
    await cartModule.deleteCarts([cartId])
  }
)
