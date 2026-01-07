import { model } from "@medusajs/framework/utils"
import BookingStaff from "./staff"

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

export enum RuleType {
  RECURRING = "recurring",
  EXCEPTION = "exception",
  BLOCKED = "blocked",
}

const BookingAvailabilityRule = model
  .define("booking_availability_rule", {
    id: model.id({ prefix: "bkavl" }).primaryKey(),
    staff: model.belongsTo(() => BookingStaff, {
      mappedBy: "availability_rules",
    }),
    rule_type: model.enum(RuleType).default(RuleType.RECURRING),
    day_of_week: model.number().nullable(),
    specific_date: model.dateTime().nullable(),
    start_time: model.text(),
    end_time: model.text(),
    is_available: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_availability_staff_day",
      on: ["staff_id", "day_of_week"],
      where: "deleted_at IS NULL AND rule_type = 'recurring'",
    },
    {
      name: "IDX_availability_staff_date",
      on: ["staff_id", "specific_date"],
      where: "deleted_at IS NULL AND specific_date IS NOT NULL",
    },
  ])

export default BookingAvailabilityRule
