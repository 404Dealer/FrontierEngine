import { model } from "@medusajs/framework/utils"

export enum DepositType {
  NONE = "none",
  FIXED = "fixed",
  PERCENT = "percent",
}

export enum PaymentModeAllowed {
  PAY_IN_STORE = "pay_in_store",
  DEPOSIT = "deposit",
  FULL = "full",
}

const BookingService = model
  .define("booking_service", {
    id: model.id({ prefix: "bksvc" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    duration_minutes: model.number().default(30),
    buffer_minutes: model.number().default(0),
    price: model.bigNumber(),
    currency_code: model.text().default("usd"),
    sales_channel_id: model.text().nullable(),
    deposit_type: model.enum(DepositType).default(DepositType.NONE),
    deposit_value: model.bigNumber().nullable(),
    payment_modes_allowed: model.json().nullable(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_booking_service_is_active",
      on: ["is_active"],
      where: "deleted_at IS NULL",
    },
  ])

export default BookingService
