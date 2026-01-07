import { model } from "@medusajs/framework/utils"
import BookingAvailabilityRule from "./availability-rule"
import BookingRecord from "./booking"

const BookingStaff = model
  .define("booking_staff", {
    id: model.id({ prefix: "bkstf" }).primaryKey(),
    name: model.text().searchable(),
    email: model.text().nullable(),
    phone: model.text().nullable(),
    bio: model.text().nullable(),
    avatar_url: model.text().nullable(),
    is_active: model.boolean().default(true),
    availability_rules: model.hasMany<any>(() => BookingAvailabilityRule, {
      mappedBy: "staff",
    }),
    bookings: model.hasMany<any>(() => BookingRecord, {
      mappedBy: "staff",
    }),
    metadata: model.json().nullable(),
  })
  .cascades({
    delete: ["availability_rules"],
  })
  .indexes([
    {
      name: "IDX_booking_staff_is_active",
      on: ["is_active"],
      where: "deleted_at IS NULL",
    },
  ])

export default BookingStaff
