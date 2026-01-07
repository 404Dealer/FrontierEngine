import { DayOfWeek, RuleType } from "../models/availability-rule"
import type { AvailabilityRuleDTO } from "@types"

/**
 * Parse a time string in "HH:MM" format to minutes from midnight.
 * @example parseTimeString("09:00") => 540
 * @example parseTimeString("17:30") => 1050
 */
export function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convert a time string ("HH:MM") and a date to a full Date object.
 * The resulting Date will have the same year/month/day as the input date,
 * with the time set to the parsed hours and minutes.
 */
export function timeStringToDate(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/**
 * Convert JavaScript's Date.getDay() (Sunday=0) to our DayOfWeek enum (Monday=0).
 * JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, ...
 * Our enum:   0=Monday, 1=Tuesday, 2=Wednesday, ..., 6=Sunday
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay()
  // Transform: Sun(0)->6, Mon(1)->0, Tue(2)->1, etc.
  return ((jsDay + 6) % 7) as DayOfWeek
}

/**
 * Generate an array of slot start times at fixed intervals.
 * @param startTime - Start of availability window ("09:00")
 * @param endTime - End of availability window ("17:00")
 * @param date - The date for which to generate slots
 * @param slotMinutes - Duration of each slot in minutes (default: 15)
 * @returns Array of Date objects representing slot start times
 */
export function generateSlotTimes(
  startTime: string,
  endTime: string,
  date: Date,
  slotMinutes: number = 15
): Date[] {
  const slots: Date[] = []
  const startMinutes = parseTimeString(startTime)
  const endMinutes = parseTimeString(endTime)

  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotMinutes) {
    const slotDate = new Date(date)
    slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    slots.push(slotDate)
  }

  return slots
}

/**
 * Check if two time ranges overlap.
 * Two ranges overlap if one starts before the other ends AND ends after the other starts.
 */
export function doTimesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Check if a time is on a 15-minute boundary (:00, :15, :30, :45).
 */
export function isOnSlotBoundary(date: Date, slotMinutes: number = 15): boolean {
  const minutes = date.getMinutes()
  return minutes % slotMinutes === 0
}

/**
 * Check if a date is in the past (before now).
 */
export function isInPast(date: Date): boolean {
  return date < new Date()
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Find the applicable availability rule for a given date.
 * Priority: BLOCKED > EXCEPTION > RECURRING
 *
 * @param rules - Array of availability rules for a staff member
 * @param date - The date to find a rule for
 * @returns The highest priority applicable rule, or null if none found
 */
export function findApplicableRule(
  rules: AvailabilityRuleDTO[],
  date: Date
): AvailabilityRuleDTO | null {
  const dayOfWeek = getDayOfWeek(date)

  // First, check for BLOCKED rules on this specific date
  const blockedRule = rules.find(
    (rule) =>
      rule.rule_type === RuleType.BLOCKED &&
      rule.specific_date &&
      isSameDay(new Date(rule.specific_date), date)
  )
  if (blockedRule) {
    return blockedRule
  }

  // Second, check for EXCEPTION rules on this specific date
  const exceptionRule = rules.find(
    (rule) =>
      rule.rule_type === RuleType.EXCEPTION &&
      rule.specific_date &&
      isSameDay(new Date(rule.specific_date), date)
  )
  if (exceptionRule) {
    return exceptionRule
  }

  // Finally, fall back to RECURRING rules for this day of week
  const recurringRule = rules.find(
    (rule) =>
      rule.rule_type === RuleType.RECURRING && rule.day_of_week === dayOfWeek
  )

  return recurringRule || null
}

/**
 * Check if a slot fits within the working hours defined by a rule.
 * The slot must start at or after start_time and end at or before end_time.
 */
export function slotFitsInWorkingHours(
  slotStart: Date,
  slotEnd: Date,
  rule: AvailabilityRuleDTO
): boolean {
  const ruleStart = timeStringToDate(rule.start_time, slotStart)
  const ruleEnd = timeStringToDate(rule.end_time, slotStart)

  return slotStart >= ruleStart && slotEnd <= ruleEnd
}
