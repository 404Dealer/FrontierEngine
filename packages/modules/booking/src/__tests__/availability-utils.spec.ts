import {
  parseTimeString,
  timeStringToDate,
  getDayOfWeek,
  generateSlotTimes,
  doTimesOverlap,
  isOnSlotBoundary,
  isSameDay,
  findApplicableRule,
  slotFitsInWorkingHours,
} from "../utils/availability"
import { DayOfWeek, RuleType } from "../models/availability-rule"
import type { AvailabilityRuleDTO } from "../types/availability-rule"

describe("Availability Utils", () => {
  describe("parseTimeString", () => {
    it("should convert '09:00' to 540 minutes", () => {
      expect(parseTimeString("09:00")).toBe(540)
    })

    it("should convert '17:30' to 1050 minutes", () => {
      expect(parseTimeString("17:30")).toBe(1050)
    })

    it("should convert '00:00' to 0 minutes", () => {
      expect(parseTimeString("00:00")).toBe(0)
    })

    it("should convert '23:59' to 1439 minutes", () => {
      expect(parseTimeString("23:59")).toBe(1439)
    })

    it("should convert '12:15' to 735 minutes", () => {
      expect(parseTimeString("12:15")).toBe(735)
    })
  })

  describe("timeStringToDate", () => {
    it("should convert time string to date with correct hours and minutes", () => {
      const baseDate = new Date("2025-01-15T00:00:00")
      const result = timeStringToDate("09:30", baseDate)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(15)
      expect(result.getHours()).toBe(9)
      expect(result.getMinutes()).toBe(30)
      expect(result.getSeconds()).toBe(0)
    })

    it("should preserve the date but change the time", () => {
      const baseDate = new Date("2025-06-20T12:00:00")
      const result = timeStringToDate("17:45", baseDate)

      expect(result.getMonth()).toBe(5) // June
      expect(result.getDate()).toBe(20)
      expect(result.getHours()).toBe(17)
      expect(result.getMinutes()).toBe(45)
    })
  })

  describe("getDayOfWeek", () => {
    it("should return 0 (MONDAY) for a Monday date", () => {
      // January 13, 2025 is a Monday - use local time to avoid timezone issues
      const monday = new Date(2025, 0, 13, 12, 0, 0)
      expect(getDayOfWeek(monday)).toBe(DayOfWeek.MONDAY)
    })

    it("should return 6 (SUNDAY) for a Sunday date", () => {
      // January 12, 2025 is a Sunday
      const sunday = new Date(2025, 0, 12, 12, 0, 0)
      expect(getDayOfWeek(sunday)).toBe(DayOfWeek.SUNDAY)
    })

    it("should return 4 (FRIDAY) for a Friday date", () => {
      // January 17, 2025 is a Friday
      const friday = new Date(2025, 0, 17, 12, 0, 0)
      expect(getDayOfWeek(friday)).toBe(DayOfWeek.FRIDAY)
    })

    it("should return 5 (SATURDAY) for a Saturday date", () => {
      // January 18, 2025 is a Saturday
      const saturday = new Date(2025, 0, 18, 12, 0, 0)
      expect(getDayOfWeek(saturday)).toBe(DayOfWeek.SATURDAY)
    })
  })

  describe("generateSlotTimes", () => {
    it("should generate correct 15-minute slots", () => {
      const date = new Date("2025-01-15")
      const slots = generateSlotTimes("09:00", "10:00", date, 15)

      expect(slots).toHaveLength(4)
      expect(slots[0].getHours()).toBe(9)
      expect(slots[0].getMinutes()).toBe(0)
      expect(slots[1].getMinutes()).toBe(15)
      expect(slots[2].getMinutes()).toBe(30)
      expect(slots[3].getMinutes()).toBe(45)
    })

    it("should generate correct 30-minute slots", () => {
      const date = new Date("2025-01-15")
      const slots = generateSlotTimes("09:00", "11:00", date, 30)

      expect(slots).toHaveLength(4)
      expect(slots[0].getMinutes()).toBe(0)
      expect(slots[1].getMinutes()).toBe(30)
      expect(slots[2].getHours()).toBe(10)
      expect(slots[2].getMinutes()).toBe(0)
      expect(slots[3].getMinutes()).toBe(30)
    })

    it("should return empty array if start equals end", () => {
      const date = new Date("2025-01-15")
      const slots = generateSlotTimes("09:00", "09:00", date, 15)

      expect(slots).toHaveLength(0)
    })

    it("should handle full day slots", () => {
      const date = new Date("2025-01-15")
      const slots = generateSlotTimes("00:00", "24:00", date, 15)

      // 24 hours * 4 slots per hour = 96 slots
      expect(slots).toHaveLength(96)
    })
  })

  describe("doTimesOverlap", () => {
    it("should return true for overlapping ranges", () => {
      const start1 = new Date("2025-01-15T09:00:00")
      const end1 = new Date("2025-01-15T10:00:00")
      const start2 = new Date("2025-01-15T09:30:00")
      const end2 = new Date("2025-01-15T10:30:00")

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    it("should return true when one range contains the other", () => {
      const start1 = new Date("2025-01-15T09:00:00")
      const end1 = new Date("2025-01-15T12:00:00")
      const start2 = new Date("2025-01-15T10:00:00")
      const end2 = new Date("2025-01-15T11:00:00")

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    it("should return false for non-overlapping ranges", () => {
      const start1 = new Date("2025-01-15T09:00:00")
      const end1 = new Date("2025-01-15T10:00:00")
      const start2 = new Date("2025-01-15T11:00:00")
      const end2 = new Date("2025-01-15T12:00:00")

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(false)
    })

    it("should return false for adjacent ranges (end equals start)", () => {
      const start1 = new Date("2025-01-15T09:00:00")
      const end1 = new Date("2025-01-15T10:00:00")
      const start2 = new Date("2025-01-15T10:00:00")
      const end2 = new Date("2025-01-15T11:00:00")

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(false)
    })
  })

  describe("isOnSlotBoundary", () => {
    it("should return true for :00 minute", () => {
      const date = new Date("2025-01-15T09:00:00")
      expect(isOnSlotBoundary(date)).toBe(true)
    })

    it("should return true for :15 minute", () => {
      const date = new Date("2025-01-15T09:15:00")
      expect(isOnSlotBoundary(date)).toBe(true)
    })

    it("should return true for :30 minute", () => {
      const date = new Date("2025-01-15T09:30:00")
      expect(isOnSlotBoundary(date)).toBe(true)
    })

    it("should return true for :45 minute", () => {
      const date = new Date("2025-01-15T09:45:00")
      expect(isOnSlotBoundary(date)).toBe(true)
    })

    it("should return false for :10 minute", () => {
      const date = new Date("2025-01-15T09:10:00")
      expect(isOnSlotBoundary(date)).toBe(false)
    })

    it("should return false for :37 minute", () => {
      const date = new Date("2025-01-15T09:37:00")
      expect(isOnSlotBoundary(date)).toBe(false)
    })
  })

  describe("isSameDay", () => {
    it("should return true for same day", () => {
      const date1 = new Date("2025-01-15T09:00:00")
      const date2 = new Date("2025-01-15T17:00:00")
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it("should return false for different days", () => {
      const date1 = new Date("2025-01-15T09:00:00")
      const date2 = new Date("2025-01-16T09:00:00")
      expect(isSameDay(date1, date2)).toBe(false)
    })

    it("should return false for different months", () => {
      const date1 = new Date("2025-01-15T09:00:00")
      const date2 = new Date("2025-02-15T09:00:00")
      expect(isSameDay(date1, date2)).toBe(false)
    })
  })

  describe("findApplicableRule", () => {
    const createRule = (
      overrides: Partial<AvailabilityRuleDTO>
    ): AvailabilityRuleDTO => ({
      id: "rule-1",
      staff_id: "staff-1",
      rule_type: RuleType.RECURRING,
      day_of_week: null,
      specific_date: null,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      ...overrides,
    })

    it("should return BLOCKED rule over other rules for the same date", () => {
      const blockedRule = createRule({
        id: "blocked-rule",
        rule_type: RuleType.BLOCKED,
        specific_date: new Date("2025-01-15"),
        is_available: false,
      })
      const recurringRule = createRule({
        id: "recurring-rule",
        rule_type: RuleType.RECURRING,
        day_of_week: DayOfWeek.WEDNESDAY, // Jan 15, 2025 is Wednesday
      })

      const rules = [recurringRule, blockedRule]
      const date = new Date("2025-01-15")

      expect(findApplicableRule(rules, date)?.id).toBe("blocked-rule")
    })

    it("should return EXCEPTION rule over RECURRING for the same date", () => {
      const exceptionRule = createRule({
        id: "exception-rule",
        rule_type: RuleType.EXCEPTION,
        specific_date: new Date("2025-01-15"),
        start_time: "10:00",
        end_time: "14:00",
      })
      const recurringRule = createRule({
        id: "recurring-rule",
        rule_type: RuleType.RECURRING,
        day_of_week: DayOfWeek.WEDNESDAY,
      })

      const rules = [recurringRule, exceptionRule]
      const date = new Date("2025-01-15")

      expect(findApplicableRule(rules, date)?.id).toBe("exception-rule")
    })

    it("should return RECURRING rule for matching day of week", () => {
      const mondayRule = createRule({
        id: "monday-rule",
        rule_type: RuleType.RECURRING,
        day_of_week: DayOfWeek.MONDAY,
      })
      const tuesdayRule = createRule({
        id: "tuesday-rule",
        rule_type: RuleType.RECURRING,
        day_of_week: DayOfWeek.TUESDAY,
      })

      const rules = [mondayRule, tuesdayRule]
      // January 13, 2025 is Monday - use local time to avoid timezone issues
      const monday = new Date(2025, 0, 13, 12, 0, 0)

      expect(findApplicableRule(rules, monday)?.id).toBe("monday-rule")
    })

    it("should return null when no rules match", () => {
      const mondayRule = createRule({
        id: "monday-rule",
        rule_type: RuleType.RECURRING,
        day_of_week: DayOfWeek.MONDAY,
      })

      const rules = [mondayRule]
      // January 14, 2025 is Tuesday - use local time to avoid timezone issues
      const tuesday = new Date(2025, 0, 14, 12, 0, 0)

      expect(findApplicableRule(rules, tuesday)).toBeNull()
    })
  })

  describe("slotFitsInWorkingHours", () => {
    const rule: AvailabilityRuleDTO = {
      id: "rule-1",
      staff_id: "staff-1",
      rule_type: RuleType.RECURRING,
      day_of_week: DayOfWeek.MONDAY,
      specific_date: null,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }

    it("should return true when slot is within working hours", () => {
      const slotStart = new Date("2025-01-13T10:00:00")
      const slotEnd = new Date("2025-01-13T10:30:00")

      expect(slotFitsInWorkingHours(slotStart, slotEnd, rule)).toBe(true)
    })

    it("should return true when slot starts at opening time", () => {
      const slotStart = new Date("2025-01-13T09:00:00")
      const slotEnd = new Date("2025-01-13T09:30:00")

      expect(slotFitsInWorkingHours(slotStart, slotEnd, rule)).toBe(true)
    })

    it("should return true when slot ends at closing time", () => {
      const slotStart = new Date("2025-01-13T16:30:00")
      const slotEnd = new Date("2025-01-13T17:00:00")

      expect(slotFitsInWorkingHours(slotStart, slotEnd, rule)).toBe(true)
    })

    it("should return false when slot starts before working hours", () => {
      const slotStart = new Date("2025-01-13T08:30:00")
      const slotEnd = new Date("2025-01-13T09:00:00")

      expect(slotFitsInWorkingHours(slotStart, slotEnd, rule)).toBe(false)
    })

    it("should return false when slot ends after working hours", () => {
      const slotStart = new Date("2025-01-13T16:45:00")
      const slotEnd = new Date("2025-01-13T17:15:00")

      expect(slotFitsInWorkingHours(slotStart, slotEnd, rule)).toBe(false)
    })
  })
})
