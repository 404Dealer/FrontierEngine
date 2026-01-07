import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../components/common/form"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import {
  useBookingSettings,
  useUpdateBookingSettings,
} from "../../../hooks/api/bookings"

const SettingsSchema = zod.object({
  allow_guest_bookings: zod.boolean(),
  default_hold_duration_minutes: zod.coerce.number().min(1),
  cancellation_window_hours: zod.coerce.number().min(0),
  timezone: zod.string(),
})

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
]

export const BookingSettings = () => {
  const { t } = useTranslation()
  const { getWidgets } = useExtension()

  const { settings, isLoading, isError, error } = useBookingSettings()
  const { mutateAsync: updateSettings, isPending } = useUpdateBookingSettings()

  const form = useForm<zod.infer<typeof SettingsSchema>>({
    defaultValues: {
      allow_guest_bookings: settings?.allow_guest_bookings ?? true,
      default_hold_duration_minutes:
        settings?.default_hold_duration_minutes ?? 10,
      cancellation_window_hours: settings?.cancellation_window_hours ?? 2,
      timezone: settings?.timezone ?? "America/New_York",
    },
    resolver: zodResolver(SettingsSchema),
    values: settings
      ? {
          allow_guest_bookings: settings.allow_guest_bookings,
          default_hold_duration_minutes: settings.default_hold_duration_minutes,
          cancellation_window_hours: settings.cancellation_window_hours,
          timezone: settings.timezone,
        }
      : undefined,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateSettings(data, {
      onSuccess: () => {
        toast.success(t("bookings.settings.edit.successToast"))
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  })

  if (isLoading) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("booking.settings.before"),
        after: getWidgets("booking.settings.after"),
      }}
    >
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>{t("bookings.settings.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("bookings.settings.subtitle")}
          </Text>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-6 py-6 space-y-6">
              <Form.Field
                control={form.control}
                name="allow_guest_bookings"
                render={({ field }) => (
                  <Form.Item>
                    <div className="flex items-center justify-between">
                      <div>
                        <Form.Label>
                          {t("bookings.settings.fields.allowGuestBookings")}
                        </Form.Label>
                        <Text size="small" className="text-ui-fg-subtle">
                          {t("bookings.settings.fields.allowGuestBookingsHint")}
                        </Text>
                      </div>
                      <Form.Control>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Form.Control>
                    </div>
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="default_hold_duration_minutes"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("bookings.settings.fields.defaultHoldDurationMinutes")}
                    </Form.Label>
                    <Text size="small" className="text-ui-fg-subtle mb-2">
                      {t(
                        "bookings.settings.fields.defaultHoldDurationMinutesHint"
                      )}
                    </Text>
                    <Form.Control>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        className="w-32"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="cancellation_window_hours"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("bookings.settings.fields.cancellationWindowHours")}
                    </Form.Label>
                    <Text size="small" className="text-ui-fg-subtle mb-2">
                      {t(
                        "bookings.settings.fields.cancellationWindowHoursHint"
                      )}
                    </Text>
                    <Form.Control>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        className="w-32"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("bookings.settings.fields.timezone")}
                    </Form.Label>
                    <Text size="small" className="text-ui-fg-subtle mb-2">
                      {t("bookings.settings.fields.timezoneHint")}
                    </Text>
                    <Form.Control>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger className="w-64">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {TIMEZONES.map((tz) => (
                            <Select.Item key={tz} value={tz}>
                              {tz}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            <div className="border-t border-ui-border-base px-6 py-4">
              <Button type="submit" isLoading={isPending}>
                {t("actions.save")}
              </Button>
            </div>
          </form>
        </Form>
      </Container>
    </SingleColumnPage>
  )
}
