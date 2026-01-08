import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import {
  BookingAvailabilityRule,
  BookingRecord,
  BookingService,
  BookingSettings,
  BookingStaff,
} from "@models"

export const joinerConfig = defineJoinerConfig(Modules.BOOKING, {
  linkableKeys: {
    booking_id: BookingRecord.name,
    service_id: BookingService.name,
    staff_id: BookingStaff.name,
    availability_rule_id: BookingAvailabilityRule.name,
  },
  models: [
    BookingAvailabilityRule,
    BookingRecord,
    BookingService,
    BookingSettings,
    BookingStaff,
  ],
})
