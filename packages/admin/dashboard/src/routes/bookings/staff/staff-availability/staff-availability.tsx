import { Plus, Trash } from "@medusajs/icons"
import {
  Button,
  Heading,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../components/modals"
import {
  AdminAvailabilityRule,
  useBookingStaffMember,
  useCreateAvailabilityRule,
  useDeleteAvailabilityRule,
} from "../../../../hooks/api/bookings"

const DAYS_OF_WEEK = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
]

const RULE_TYPES = ["recurring", "exception", "blocked"] as const

type NewRuleForm = {
  rule_type: typeof RULE_TYPES[number]
  day_of_week: string
  start_time: string
  end_time: string
  specific_date: string
}

const defaultNewRule: NewRuleForm = {
  rule_type: "recurring",
  day_of_week: "0",
  start_time: "09:00",
  end_time: "17:00",
  specific_date: "",
}

export const StaffAvailability = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { handleSuccess } = useRouteModal()

  const { staff, isLoading, refetch } = useBookingStaffMember(id!, {
    fields: "+availability_rules",
  })
  const { mutateAsync: createRule, isPending: isCreating } =
    useCreateAvailabilityRule(id!)
  const { mutateAsync: deleteRule } = useDeleteAvailabilityRule(id!)

  const [newRule, setNewRule] = useState<NewRuleForm>(defaultNewRule)
  const [showAddForm, setShowAddForm] = useState(false)

  const rules = staff?.availability_rules || []

  const groupedRules = {
    recurring: rules.filter((r) => r.rule_type === "recurring"),
    exception: rules.filter((r) => r.rule_type === "exception"),
    blocked: rules.filter((r) => r.rule_type === "blocked"),
  }

  const handleAddRule = async () => {
    try {
      await createRule({
        rule_type: newRule.rule_type,
        day_of_week:
          newRule.rule_type === "recurring"
            ? parseInt(newRule.day_of_week)
            : undefined,
        start_time:
          newRule.rule_type !== "blocked" ? newRule.start_time : undefined,
        end_time:
          newRule.rule_type !== "blocked" ? newRule.end_time : undefined,
        specific_date:
          newRule.rule_type !== "recurring" ? newRule.specific_date : undefined,
      })
      toast.success(t("bookings.staff.availability.ruleAdded"))
      setNewRule(defaultNewRule)
      setShowAddForm(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId)
      toast.success(t("bookings.staff.availability.ruleDeleted"))
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (isLoading || !staff) {
    return null
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-col items-center py-16">
        <div className="flex w-full max-w-[900px] flex-col gap-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Heading>{t("bookings.staff.availability.editTitle")}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {t("bookings.staff.availability.editSubtitle", {
                  name: staff.name,
                })}
              </Text>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus />
              {t("bookings.staff.availability.addRule")}
            </Button>
          </div>

          {showAddForm && (
            <div className="rounded-lg border border-ui-border-base p-4">
              <Heading level="h3" className="mb-4">
                {t("bookings.staff.availability.newRule")}
              </Heading>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Text size="small" weight="plus" className="mb-2">
                    {t("bookings.staff.availability.ruleTypeLabel")}
                  </Text>
                  <Select
                    value={newRule.rule_type}
                    onValueChange={(value) =>
                      setNewRule({
                        ...newRule,
                        rule_type: value as typeof RULE_TYPES[number],
                      })
                    }
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {RULE_TYPES.map((type) => (
                        <Select.Item key={type} value={type}>
                          {t(`bookings.staff.availability.ruleType.${type}`)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                {newRule.rule_type === "recurring" && (
                  <div>
                    <Text size="small" weight="plus" className="mb-2">
                      {t("bookings.staff.availability.dayOfWeek")}
                    </Text>
                    <Select
                      value={newRule.day_of_week}
                      onValueChange={(value) =>
                        setNewRule({ ...newRule, day_of_week: value })
                      }
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {DAYS_OF_WEEK.map((day) => (
                          <Select.Item key={day.value} value={day.value}>
                            {day.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                )}

                {newRule.rule_type !== "recurring" && (
                  <div>
                    <Text size="small" weight="plus" className="mb-2">
                      {t("bookings.staff.availability.specificDate")}
                    </Text>
                    <Input
                      type="date"
                      value={newRule.specific_date}
                      onChange={(e) =>
                        setNewRule({ ...newRule, specific_date: e.target.value })
                      }
                    />
                  </div>
                )}

                {newRule.rule_type !== "blocked" && (
                  <>
                    <div>
                      <Text size="small" weight="plus" className="mb-2">
                        {t("bookings.staff.availability.startTime")}
                      </Text>
                      <Input
                        type="time"
                        value={newRule.start_time}
                        onChange={(e) =>
                          setNewRule({ ...newRule, start_time: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Text size="small" weight="plus" className="mb-2">
                        {t("bookings.staff.availability.endTime")}
                      </Text>
                      <Input
                        type="time"
                        value={newRule.end_time}
                        onChange={(e) =>
                          setNewRule({ ...newRule, end_time: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-x-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowAddForm(false)}
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  size="small"
                  onClick={handleAddRule}
                  isLoading={isCreating}
                >
                  {t("actions.add")}
                </Button>
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          <div>
            <Heading level="h3" className="mb-4">
              {t("bookings.staff.availability.ruleType.recurring")}
            </Heading>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const dayRules = groupedRules.recurring.filter(
                  (r) => r.day_of_week === parseInt(day.value)
                )
                return (
                  <div
                    key={day.value}
                    className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3"
                  >
                    <Text size="small" weight="plus" className="w-24">
                      {day.label}
                    </Text>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {dayRules.length > 0 ? (
                        dayRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center gap-x-2 rounded bg-ui-bg-subtle px-2 py-1"
                          >
                            <Text size="small">
                              {rule.start_time} - {rule.end_time}
                            </Text>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-ui-fg-muted hover:text-ui-fg-base"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <Text size="small" className="text-ui-fg-muted">
                          {t("bookings.staff.availability.closed")}
                        </Text>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Exceptions */}
          {groupedRules.exception.length > 0 && (
            <div>
              <Heading level="h3" className="mb-4">
                {t("bookings.staff.availability.ruleType.exception")}
              </Heading>
              <div className="space-y-2">
                {groupedRules.exception.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3"
                  >
                    <Text size="small">{rule.specific_date}</Text>
                    <div className="flex items-center gap-x-4">
                      <Text size="small">
                        {rule.start_time} - {rule.end_time}
                      </Text>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-ui-fg-muted hover:text-ui-fg-base"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Dates */}
          {groupedRules.blocked.length > 0 && (
            <div>
              <Heading level="h3" className="mb-4">
                {t("bookings.staff.availability.ruleType.blocked")}
              </Heading>
              <div className="flex flex-wrap gap-2">
                {groupedRules.blocked.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-x-2 rounded bg-ui-bg-subtle px-3 py-2"
                  >
                    <Text size="small">{rule.specific_date}</Text>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-ui-fg-muted hover:text-ui-fg-base"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.done")}
              </Button>
            </RouteFocusModal.Close>
          </div>
        </div>
      </RouteFocusModal.Body>
    </RouteFocusModal>
  )
}
