import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import * as zod from "zod"

import { Form } from "../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../components/modals"
import {
  useBooking,
  useBookingServices,
  useBookingStaff,
  useUpdateBooking,
} from "../../../hooks/api/bookings"

const BookingEditSchema = zod.object({
  staff_id: zod.string().min(1, "Staff is required"),
  service_id: zod.string().min(1, "Service is required"),
  start_at: zod.string().min(1, "Start time is required"),
  notes: zod.string().optional(),
})

export const BookingEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { handleSuccess } = useRouteModal()

  const { booking, isLoading: isBookingLoading } = useBooking(id!)
  const { services } = useBookingServices({ limit: 100 })
  const { staff } = useBookingStaff({ limit: 100 })
  const { mutateAsync: updateBooking, isPending } = useUpdateBooking(id!)

  const form = useForm<zod.infer<typeof BookingEditSchema>>({
    defaultValues: {
      staff_id: "",
      service_id: "",
      start_at: "",
      notes: "",
    },
    values: booking
      ? {
          staff_id: booking.staff_id,
          service_id: booking.service_id,
          start_at: booking.start_at
            ? new Date(booking.start_at).toISOString().slice(0, 16)
            : "",
          notes: booking.notes || "",
        }
      : undefined,
    resolver: zodResolver(BookingEditSchema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateBooking(
      {
        staff_id: data.staff_id,
        service_id: data.service_id,
        start_at: new Date(data.start_at).toISOString(),
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("bookings.edit.successToast"))
          handleSuccess()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  if (isBookingLoading || !booking) {
    return null
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-col items-center py-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div>
            <Heading>{t("bookings.edit.header")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("bookings.edit.hint")}
            </Text>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("bookings.fields.service")}</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {services?.map((service) => (
                              <Select.Item key={service.id} value={service.id}>
                                {service.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="staff_id"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("bookings.fields.staff")}</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {staff?.map((s) => (
                              <Select.Item key={s.id} value={s.id}>
                                {s.name}
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

              <Form.Field
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("bookings.fields.startAt")}</Form.Label>
                    <Form.Control>
                      <Input type="datetime-local" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("bookings.fields.notes")}</Form.Label>
                    <Form.Control>
                      <Textarea {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <div className="flex items-center justify-end gap-x-2">
                <RouteFocusModal.Close asChild>
                  <Button variant="secondary" size="small">
                    {t("actions.cancel")}
                  </Button>
                </RouteFocusModal.Close>
                <Button type="submit" size="small" isLoading={isPending}>
                  {t("actions.save")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </RouteFocusModal.Body>
    </RouteFocusModal>
  )
}
