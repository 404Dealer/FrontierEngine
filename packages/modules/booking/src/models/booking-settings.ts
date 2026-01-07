import { model } from "@medusajs/framework/utils"

const BookingSettings = model.define("booking_settings", {
  id: model.id({ prefix: "bkset" }).primaryKey(),
  allow_guest_bookings: model.boolean().default(true),
  default_hold_duration_minutes: model.number().default(10),
  cancellation_window_hours: model.number().default(2),
  timezone: model.text().default("America/New_York"),
  metadata: model.json().nullable(),
})

export default BookingSettings
