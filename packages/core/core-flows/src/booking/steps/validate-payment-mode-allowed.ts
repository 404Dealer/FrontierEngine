import { DepositType, PaymentMode } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const validatePaymentModeAllowedStepId =
  "validate-payment-mode-allowed"

/**
 * Payment mode categories stored in service.payment_modes_allowed
 */
type PaymentModeCategory = "in_person" | "online"

export interface ValidatePaymentModeAllowedInput {
  /**
   * The payment mode requested by the customer.
   */
  payment_mode: PaymentMode
  /**
   * The service being booked.
   */
  service: {
    name: string
    deposit_type: DepositType | string
    payment_modes_allowed: PaymentModeCategory[] | null
  }
}

/**
 * Payment mode category mapping:
 * - "in_person" allows: pay_in_store
 * - "online" allows: deposit, full
 */
const PAYMENT_MODE_CATEGORY_MAP: Record<PaymentMode, PaymentModeCategory> = {
  [PaymentMode.PAY_IN_STORE]: "in_person",
  [PaymentMode.DEPOSIT]: "online",
  [PaymentMode.FULL]: "online",
}

/**
 * This step validates that the requested payment mode is allowed for the service.
 *
 * It checks:
 * 1. If the payment mode's category (in_person/online) is in the service's allowed modes
 * 2. If the service has a deposit configured, pay_in_store is not allowed
 *
 * @example
 * validatePaymentModeAllowedStep({
 *   payment_mode: PaymentMode.PAY_IN_STORE,
 *   service: { name: "Haircut", deposit_type: "none", payment_modes_allowed: ["in_person", "online"] }
 * })
 */
export const validatePaymentModeAllowedStep = createStep(
  { name: validatePaymentModeAllowedStepId, noCompensation: true },
  async (input: ValidatePaymentModeAllowedInput) => {
    const { payment_mode, service } = input

    // Get the allowed modes, defaulting to both if not set
    const allowedModes: PaymentModeCategory[] =
      service.payment_modes_allowed ?? ["in_person", "online"]

    // Map the payment mode to its category
    const requestedCategory = PAYMENT_MODE_CATEGORY_MAP[payment_mode]

    // Check if the category is allowed
    if (!allowedModes.includes(requestedCategory)) {
      const modeDescription =
        payment_mode === PaymentMode.PAY_IN_STORE
          ? "Pay in store"
          : payment_mode === PaymentMode.DEPOSIT
            ? "Deposit"
            : "Full payment"

      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `${modeDescription} is not available for "${service.name}". ` +
          `This service only accepts ${allowedModes.includes("online") ? "online" : "in-person"} payment.`
      )
    }

    // Check if service has a deposit configured
    // deposit_type can be enum or string value from database
    const depositTypeStr = String(service.deposit_type)
    const hasDeposit =
      depositTypeStr !== DepositType.NONE && depositTypeStr !== "none"

    // If service has a deposit configured, pay_in_store is not allowed
    // (deposit requires collecting payment upfront)
    if (payment_mode === PaymentMode.PAY_IN_STORE && hasDeposit) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `"${service.name}" requires a deposit. Please select online payment to proceed.`
      )
    }

    // If requesting deposit mode, ensure the service actually has a deposit configured
    if (payment_mode === PaymentMode.DEPOSIT && !hasDeposit) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `"${service.name}" does not have a deposit configured. Please select full payment or pay in store.`
      )
    }

    return new StepResponse(undefined)
  }
)
