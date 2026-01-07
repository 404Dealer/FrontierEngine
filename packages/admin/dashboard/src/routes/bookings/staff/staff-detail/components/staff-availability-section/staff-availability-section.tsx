import { PencilSquare } from "@medusajs/icons"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import {
  AdminAvailabilityRule,
  AdminBookingStaff,
} from "../../../../../../hooks/api/bookings"

type StaffAvailabilitySectionProps = {
  staff: AdminBookingStaff
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? "PM" : "AM"
  const formattedHour = h % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}

const groupRulesByType = (rules: AdminAvailabilityRule[]) => {
  const recurring: { [key: number]: AdminAvailabilityRule[] } = {}
  const exceptions: AdminAvailabilityRule[] = []
  const blocked: AdminAvailabilityRule[] = []

  rules.forEach((rule) => {
    if (rule.rule_type === "recurring" && rule.day_of_week !== null) {
      if (!recurring[rule.day_of_week]) {
        recurring[rule.day_of_week] = []
      }
      recurring[rule.day_of_week].push(rule)
    } else if (rule.rule_type === "exception") {
      exceptions.push(rule)
    } else if (rule.rule_type === "blocked") {
      blocked.push(rule)
    }
  })

  return { recurring, exceptions, blocked }
}

export const StaffAvailabilitySection = ({
  staff,
}: StaffAvailabilitySectionProps) => {
  const { t } = useTranslation()
  const rules = staff.availability_rules || []
  const { recurring, exceptions, blocked } = groupRulesByType(rules)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("bookings.staff.availability.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("bookings.staff.availability.subtitle")}
          </Text>
        </div>
        <Link to="availability">
          <Button size="small" variant="secondary">
            <PencilSquare />
            {t("actions.edit")}
          </Button>
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text className="text-ui-fg-muted">
            {t("bookings.staff.availability.noRules")}
          </Text>
        </div>
      ) : (
        <>
          {/* Weekly Schedule */}
          <div className="px-6 py-4">
            <Text size="small" weight="plus" className="mb-3">
              {t("bookings.staff.availability.ruleType.recurring")}
            </Text>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayRules = recurring[index]
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-ui-border-base py-2 last:border-0"
                  >
                    <Text size="small" className="w-24">
                      {day}
                    </Text>
                    <Text
                      size="small"
                      className={
                        dayRules ? "text-ui-fg-base" : "text-ui-fg-muted"
                      }
                    >
                      {dayRules
                        ? dayRules
                            .map(
                              (r) =>
                                `${formatTime(r.start_time)} - ${formatTime(r.end_time)}`
                            )
                            .join(", ")
                        : "Closed"}
                    </Text>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Exceptions */}
          {exceptions.length > 0 && (
            <div className="px-6 py-4">
              <Text size="small" weight="plus" className="mb-3">
                {t("bookings.staff.availability.ruleType.exception")}
              </Text>
              <div className="space-y-2">
                {exceptions.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between"
                  >
                    <Text size="small">{rule.specific_date}</Text>
                    <Text size="small">
                      {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Dates */}
          {blocked.length > 0 && (
            <div className="px-6 py-4">
              <Text size="small" weight="plus" className="mb-3">
                {t("bookings.staff.availability.ruleType.blocked")}
              </Text>
              <div className="flex flex-wrap gap-2">
                {blocked.map((rule) => (
                  <Text
                    key={rule.id}
                    size="small"
                    className="rounded bg-ui-bg-subtle px-2 py-1"
                  >
                    {rule.specific_date}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}
