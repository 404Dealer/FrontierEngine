import { DayOfWeek, RuleType } from "../models/availability-rule"
import type { AvailabilityRuleDTO } from "@types"

/**
 * Ensure a value is a Date object.
 * Handles strings (ISO format), numbers (timestamps), and existing Date objects.
 * This is needed because data passing through Medusa's workflow engine
 * may serialize Date objects to ISO strings.
 *
 * IMPORTANT: For date-only strings (YYYY-MM-DD), this parses as LOCAL midnight
 * to avoid timezone shift issues. Full ISO strings with time are parsed normally.
 */
export function ensureDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === "string") {
    // Check if it's a date-only string (YYYY-MM-DD)
    // Parse as local midnight to avoid UTC shift issues
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
    }
  }
  return new Date(value)
}

/**
 * Get today's date as a YYYY-MM-DD string in local timezone.
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Get a date as a YYYY-MM-DD string in local timezone.
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Compare two dates by their date string (YYYY-MM-DD) in local timezone.
 * Returns true if date1 < date2 (date1 is before date2).
 */
export function isDateBefore(date1: Date | string, date2: Date | string): boolean {
  const d1 = ensureDate(date1)
  const d2 = ensureDate(date2)
  return getDateString(d1) < getDateString(d2)
}

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
 * with the time set to the parsed hours and minutes in LOCAL timezone.
 * Working hours are defined in business local time.
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
 * Uses LOCAL timezone since working hours are in business local time.
 */
export function getDayOfWeek(date: Date | string): DayOfWeek {
  const d = ensureDate(date)
  const jsDay = d.getDay()
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
 * Uses LOCAL timezone since working hours are in business local time.
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
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = ensureDate(start1)
  const e1 = ensureDate(end1)
  const s2 = ensureDate(start2)
  const e2 = ensureDate(end2)
  return s1 < e2 && e1 > s2
}

/**
 * Check if a time is on a 15-minute boundary (:00, :15, :30, :45).
 * Uses LOCAL timezone since working hours are in business local time.
 */
export function isOnSlotBoundary(date: Date | string, slotMinutes: number = 15): boolean {
  const d = ensureDate(date)
  const minutes = d.getMinutes()
  return minutes % slotMinutes === 0
}

/**
 * Check if a date is in the past (before now).
 */
export function isInPast(date: Date | string): boolean {
  return ensureDate(date) < new Date()
}

/**
 * Check if two dates are the same calendar day in LOCAL timezone.
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = ensureDate(date1)
  const d2 = ensureDate(date2)
  return getDateString(d1) === getDateString(d2)
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
  date: Date | string
): AvailabilityRuleDTO | null {
  const d = ensureDate(date)
  const dayOfWeek = getDayOfWeek(d)

  // First, check for BLOCKED rules on this specific date
  const blockedRule = rules.find(
    (rule) =>
      rule.rule_type === RuleType.BLOCKED &&
      rule.specific_date &&
      isSameDay(new Date(rule.specific_date), d)
  )
  if (blockedRule) {
    return blockedRule
  }

  // Second, check for EXCEPTION rules on this specific date
  const exceptionRule = rules.find(
    (rule) =>
      rule.rule_type === RuleType.EXCEPTION &&
      rule.specific_date &&
      isSameDay(new Date(rule.specific_date), d)
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
  slotStart: Date | string,
  slotEnd: Date | string,
  rule: AvailabilityRuleDTO
): boolean {
  const start = ensureDate(slotStart)
  const end = ensureDate(slotEnd)
  const ruleStart = timeStringToDate(rule.start_time, start)
  const ruleEnd = timeStringToDate(rule.end_time, start)

  return start >= ruleStart && end <= ruleEnd
}
