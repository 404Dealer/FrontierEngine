import { Pencil, Plus, Trash, ChevronDownMini, ChevronUpMini, ArrowPath } from "@medusajs/icons"
import {
  Button,
  Heading,
  Input,
  Switch,
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
  AdminBookingStaff,
  useBookingStaffMember,
  useCreateAvailabilityRule,
  useDeleteAvailabilityRule,
  useUpdateAvailabilityRule,
} from "../../../../hooks/api/bookings"

const DAYS_OF_WEEK = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
]

const DEFAULT_START_TIME = "09:00"
const DEFAULT_END_TIME = "17:00"

export const StaffAvailability = () => {
  const { id } = useParams()
  const { staff, isLoading, refetch } = useBookingStaffMember(id!, {
    fields: "+availability_rules",
  })

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      {!isLoading && staff && (
        <StaffAvailabilityForm staff={staff} refetch={refetch} />
      )}
    </RouteFocusModal>
  )
}

type StaffAvailabilityFormProps = {
  staff: AdminBookingStaff & { availability_rules?: AdminAvailabilityRule[] }
  refetch: () => void
}

const StaffAvailabilityForm = ({ staff, refetch }: StaffAvailabilityFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync: createRule, isPending: isCreating } =
    useCreateAvailabilityRule(staff.id)
  const { mutateAsync: deleteRule, isPending: isDeleting } = useDeleteAvailabilityRule(staff.id)
  const [isResetting, setIsResetting] = useState(false)

  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editTimes, setEditTimes] = useState({ start: "", end: "" })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAddException, setShowAddException] = useState(false)
  const [showAddBlocked, setShowAddBlocked] = useState(false)
  const [newException, setNewException] = useState({
    date: "",
    start_time: DEFAULT_START_TIME,
    end_time: DEFAULT_END_TIME,
  })
  const [newBlocked, setNewBlocked] = useState({ date: "" })

  const rules = staff.availability_rules || []

  const groupedRules = {
    recurring: rules.filter((r) => r.rule_type === "recurring"),
    exception: rules.filter((r) => r.rule_type === "exception"),
    blocked: rules.filter((r) => r.rule_type === "blocked"),
  }

  // Get the recurring rule for a specific day
  const getRuleForDay = (dayOfWeek: number): AdminAvailabilityRule | undefined => {
    return groupedRules.recurring.find((r) => r.day_of_week === dayOfWeek)
  }

  // Toggle a day on/off
  const handleDayToggle = async (dayOfWeek: number, isEnabled: boolean) => {
    const existingRule = getRuleForDay(dayOfWeek)

    if (isEnabled && !existingRule) {
      // Create a new recurring rule with default hours
      try {
        await createRule({
          rule_type: "recurring",
          day_of_week: dayOfWeek,
          start_time: DEFAULT_START_TIME,
          end_time: DEFAULT_END_TIME,
        })
        toast.success(t("bookings.staff.availability.dayEnabled"))
        refetch()
      } catch (err: any) {
        toast.error(err.message)
      }
    } else if (!isEnabled && existingRule) {
      // Delete the existing rule
      try {
        await deleteRule(existingRule.id)
        toast.success(t("bookings.staff.availability.dayDisabled"))
        refetch()
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  }

  // Start editing a day's hours
  const handleStartEdit = (dayOfWeek: number) => {
    const rule = getRuleForDay(dayOfWeek)
    if (rule) {
      setEditTimes({
        start: rule.start_time || DEFAULT_START_TIME,
        end: rule.end_time || DEFAULT_END_TIME,
      })
      setEditingDay(dayOfWeek)
    }
  }

  // Handle adding an exception
  const handleAddException = async () => {
    if (!newException.date) {
      toast.error(t("bookings.staff.availability.dateRequired"))
      return
    }
    try {
      await createRule({
        rule_type: "exception",
        specific_date: newException.date,
        start_time: newException.start_time,
        end_time: newException.end_time,
      })
      toast.success(t("bookings.staff.availability.ruleAdded"))
      setNewException({
        date: "",
        start_time: DEFAULT_START_TIME,
        end_time: DEFAULT_END_TIME,
      })
      setShowAddException(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Handle adding a blocked date
  const handleAddBlocked = async () => {
    if (!newBlocked.date) {
      toast.error(t("bookings.staff.availability.dateRequired"))
      return
    }
    try {
      await createRule({
        rule_type: "blocked",
        specific_date: newBlocked.date,
      })
      toast.success(t("bookings.staff.availability.ruleAdded"))
      setNewBlocked({ date: "" })
      setShowAddBlocked(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Handle deleting a rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId)
      toast.success(t("bookings.staff.availability.ruleDeleted"))
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Reset schedule - delete all recurring rules (sets all days to closed)
  const handleResetSchedule = async () => {
    if (groupedRules.recurring.length === 0) {
      toast.info(t("bookings.staff.availability.scheduleAlreadyClear"))
      return
    }

    setIsResetting(true)
    try {
      // Delete all recurring rules
      for (const rule of groupedRules.recurring) {
        await deleteRule(rule.id)
      }
      toast.success(t("bookings.staff.availability.scheduleReset"))
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <RouteFocusModal.Body className="flex flex-col items-center py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading>{t("bookings.staff.availability.editTitle")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("bookings.staff.availability.editSubtitle", {
              name: staff.name,
            })}
          </Text>
        </div>

        {/* Weekly Schedule with Toggles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Heading level="h3">
              {t("bookings.staff.availability.weeklySchedule")}
            </Heading>
            <Button
              variant="secondary"
              size="small"
              onClick={handleResetSchedule}
              disabled={isResetting || groupedRules.recurring.length === 0}
            >
              <ArrowPath className="h-4 w-4 mr-2" />
              {isResetting
                ? t("bookings.staff.availability.resetting")
                : t("bookings.staff.availability.resetSchedule")}
            </Button>
          </div>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const rule = getRuleForDay(day.value)
              const isEnabled = !!rule
              const isEditing = editingDay === day.value

              return (
                <DayRow
                  key={day.value}
                  day={day}
                  isEnabled={isEnabled}
                  rule={rule}
                  isEditing={isEditing}
                  editTimes={editTimes}
                  onToggle={(enabled) => handleDayToggle(day.value, enabled)}
                  onStartEdit={() => handleStartEdit(day.value)}
                  onCancelEdit={() => setEditingDay(null)}
                  onTimeChange={setEditTimes}
                  staffId={staff.id}
                  refetch={refetch}
                  t={t}
                />
              )
            })}
          </div>
        </div>

        {/* Advanced Section */}
        <div className="border-t border-ui-border-base pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between"
          >
            <Heading level="h3">
              {t("bookings.staff.availability.advanced")}
            </Heading>
            {showAdvanced ? (
              <ChevronUpMini className="h-5 w-5 text-ui-fg-muted" />
            ) : (
              <ChevronDownMini className="h-5 w-5 text-ui-fg-muted" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {/* Exceptions Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Text size="small" weight="plus">
                      {t("bookings.staff.availability.ruleType.exception")}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {t("bookings.staff.availability.exceptionHint")}
                    </Text>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setShowAddException(!showAddException)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {showAddException && (
                  <div className="mb-3 rounded-lg border border-ui-border-base p-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Text size="xsmall" className="mb-1">
                          {t("bookings.staff.availability.fields.specificDate")}
                        </Text>
                        <Input
                          type="date"
                          value={newException.date}
                          onChange={(e) =>
                            setNewException({ ...newException, date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Text size="xsmall" className="mb-1">
                          {t("bookings.staff.availability.fields.startTime")}
                        </Text>
                        <Input
                          type="time"
                          value={newException.start_time}
                          onChange={(e) =>
                            setNewException({
                              ...newException,
                              start_time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Text size="xsmall" className="mb-1">
                          {t("bookings.staff.availability.fields.endTime")}
                        </Text>
                        <Input
                          type="time"
                          value={newException.end_time}
                          onChange={(e) =>
                            setNewException({
                              ...newException,
                              end_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setShowAddException(false)}
                      >
                        {t("actions.cancel")}
                      </Button>
                      <Button size="small" onClick={handleAddException}>
                        {t("actions.add")}
                      </Button>
                    </div>
                  </div>
                )}

                {groupedRules.exception.length > 0 ? (
                  <div className="space-y-2">
                    {groupedRules.exception.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-lg border border-ui-border-base px-3 py-2"
                      >
                        <Text size="small">{rule.specific_date}</Text>
                        <div className="flex items-center gap-x-3">
                          <Text size="small" className="text-ui-fg-subtle">
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
                ) : (
                  <Text size="small" className="text-ui-fg-muted">
                    {t("bookings.staff.availability.noExceptions")}
                  </Text>
                )}
              </div>

              {/* Blocked Dates Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Text size="small" weight="plus">
                      {t("bookings.staff.availability.ruleType.blocked")}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {t("bookings.staff.availability.blockedHint")}
                    </Text>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setShowAddBlocked(!showAddBlocked)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {showAddBlocked && (
                  <div className="mb-3 rounded-lg border border-ui-border-base p-3">
                    <div>
                      <Text size="xsmall" className="mb-1">
                        {t("bookings.staff.availability.fields.specificDate")}
                      </Text>
                      <Input
                        type="date"
                        value={newBlocked.date}
                        onChange={(e) =>
                          setNewBlocked({ date: e.target.value })
                        }
                      />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setShowAddBlocked(false)}
                      >
                        {t("actions.cancel")}
                      </Button>
                      <Button size="small" onClick={handleAddBlocked}>
                        {t("actions.add")}
                      </Button>
                    </div>
                  </div>
                )}

                {groupedRules.blocked.length > 0 ? (
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
                ) : (
                  <Text size="small" className="text-ui-fg-muted">
                    {t("bookings.staff.availability.noBlockedDates")}
                  </Text>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary" size="small">
              {t("actions.done")}
            </Button>
          </RouteFocusModal.Close>
        </div>
      </div>
    </RouteFocusModal.Body>
  )
}

// Separate DayRow component for cleaner code
type DayRowProps = {
  day: { value: number; label: string }
  isEnabled: boolean
  rule?: AdminAvailabilityRule
  isEditing: boolean
  editTimes: { start: string; end: string }
  onToggle: (enabled: boolean) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onTimeChange: (times: { start: string; end: string }) => void
  staffId: string
  refetch: () => void
  t: (key: string) => string
}

const DayRow = ({
  day,
  isEnabled,
  rule,
  isEditing,
  editTimes,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onTimeChange,
  staffId,
  refetch,
  t,
}: DayRowProps) => {
  const { mutateAsync: updateRule, isPending: isUpdating } =
    useUpdateAvailabilityRule(staffId, rule?.id || "")

  const handleSave = async () => {
    if (!rule) return
    try {
      await updateRule({
        start_time: editTimes.start,
        end_time: editTimes.end,
      })
      toast.success(t("bookings.staff.availability.hoursUpdated"))
      onCancelEdit()
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3">
      <div className="flex items-center gap-x-4">
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggle}
        />
        <Text size="small" weight="plus" className="w-24">
          {day.label}
        </Text>
      </div>

      <div className="flex items-center gap-x-3">
        {isEnabled ? (
          isEditing ? (
            <div className="flex items-center gap-x-2">
              <Input
                type="time"
                value={editTimes.start}
                onChange={(e) =>
                  onTimeChange({ ...editTimes, start: e.target.value })
                }
                className="w-28"
              />
              <Text size="small">-</Text>
              <Input
                type="time"
                value={editTimes.end}
                onChange={(e) =>
                  onTimeChange({ ...editTimes, end: e.target.value })
                }
                className="w-28"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={onCancelEdit}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                size="small"
                onClick={handleSave}
                isLoading={isUpdating}
              >
                {t("actions.save")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-x-3">
              <Text size="small" className="text-ui-fg-base">
                {rule?.start_time || DEFAULT_START_TIME} - {rule?.end_time || DEFAULT_END_TIME}
              </Text>
              <button
                onClick={onStartEdit}
                className="text-ui-fg-muted hover:text-ui-fg-base"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            {t("bookings.staff.availability.closed")}
          </Text>
        )}
      </div>
    </div>
  )
}
