import { model } from "@medusajs/framework/utils"
import BookingStaff from "./staff"

export enum BookingStatus {
  HELD = "held",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  NO_SHOW = "no_show",
}

export enum PaymentMode {
  PAY_IN_STORE = "pay_in_store",
  DEPOSIT = "deposit",
  FULL = "full",
}

const BookingRecord = model
  .define({ name: "BookingRecord", tableName: "booking" }, {
    id: model.id({ prefix: "book" }).primaryKey(),
    display_id: model.autoincrement(),
    staff: model.belongsTo(() => BookingStaff, {
      mappedBy: "bookings",
    }),
    service_id: model.text(),
    customer_id: model.text().nullable(),

    // Time slot
    start_at: model.dateTime(),
    end_at: model.dateTime(),

    // Status
    status: model.enum(BookingStatus).default(BookingStatus.HELD),
    hold_expires_at: model.dateTime().nullable(),

    // Pricing snapshot (immutable after creation)
    service_name: model.text(),
    price_amount: model.bigNumber(),
    currency_code: model.text(),
    deposit_amount: model.bigNumber().nullable(),

    // Payment tracking
    payment_mode: model.enum(PaymentMode).nullable(),
    amount_paid: model.bigNumber().nullable(),

    // Customer info (for guests)
    customer_email: model.text().nullable(),
    customer_phone: model.text().nullable(),
    customer_name: model.text().nullable(),

    // Notes
    notes: model.text().nullable(),
    internal_notes: model.text().nullable(),

    // Timestamps
    confirmed_at: model.dateTime().nullable(),
    cancelled_at: model.dateTime().nullable(),
    completed_at: model.dateTime().nullable(),

    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_booking_staff_start",
      on: ["staff_id", "start_at"],
      unique: true,
      where: "deleted_at IS NULL AND status IN ('held', 'confirmed')",
    },
    {
      name: "IDX_booking_status",
      on: ["status"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_booking_customer",
      on: ["customer_id"],
      where: "deleted_at IS NULL AND customer_id IS NOT NULL",
    },
    {
      name: "IDX_booking_hold_expires",
      on: ["hold_expires_at"],
      where: "deleted_at IS NULL AND status = 'held'",
    },
    {
      name: "IDX_booking_date_range",
      on: ["start_at", "end_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default BookingRecord
