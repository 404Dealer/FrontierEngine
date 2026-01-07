import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import * as zod from "zod"

import { Form } from "../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../components/modals"
import {
  useBookingServices,
  useBookingStaff,
  useCreateBooking,
} from "../../../hooks/api/bookings"

const BookingCreateSchema = zod.object({
  staff_id: zod.string().min(1, "Staff is required"),
  service_id: zod.string().min(1, "Service is required"),
  start_at: zod.string().min(1, "Start time is required"),
  customer_email: zod.string().email().optional().or(zod.literal("")),
  customer_phone: zod.string().optional(),
  customer_name: zod.string().optional(),
  notes: zod.string().optional(),
})

export const BookingCreate = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { handleSuccess } = useRouteModal()

  const { services } = useBookingServices({ limit: 100 })
  const { staff } = useBookingStaff({ limit: 100 })
  const { mutateAsync: createBooking, isPending } = useCreateBooking()

  const form = useForm<zod.infer<typeof BookingCreateSchema>>({
    defaultValues: {
      staff_id: "",
      service_id: "",
      start_at: "",
      customer_email: "",
      customer_phone: "",
      customer_name: "",
      notes: "",
    },
    resolver: zodResolver(BookingCreateSchema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await createBooking(
      {
        staff_id: data.staff_id,
        service_id: data.service_id,
        start_at: new Date(data.start_at).toISOString(),
        customer_email: data.customer_email || undefined,
        customer_phone: data.customer_phone || undefined,
        customer_name: data.customer_name || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: ({ booking }) => {
          toast.success(t("bookings.create.successToast"))
          handleSuccess(`/bookings/${booking.id}`)
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-col items-center py-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div>
            <Heading>{t("bookings.create.header")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("bookings.create.hint")}
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
                            <Select.Value placeholder={t("bookings.create.selectService")} />
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
                            <Select.Value placeholder={t("bookings.create.selectStaff")} />
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("bookings.fields.customerName")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("bookings.fields.customerEmail")}</Form.Label>
                      <Form.Control>
                        <Input type="email" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              <Form.Field
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("bookings.fields.customerPhone")}</Form.Label>
                    <Form.Control>
                      <Input type="tel" {...field} />
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
                  {t("actions.create")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </RouteFocusModal.Body>
    </RouteFocusModal>
  )
}
