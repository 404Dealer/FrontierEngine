import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"

export const joinerConfig = defineJoinerConfig(Modules.BOOKING, {
  linkableKeys: {
    booking_id: "Booking",
    service_id: "Service",
    staff_id: "Staff",
    availability_rule_id: "AvailabilityRule",
  },
})
