import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Checkbox,
  Heading,
  Input,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import * as zod from "zod"

import { Form } from "../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../components/modals"
import {
  useBookingService,
  useUpdateBookingService,
} from "../../../../hooks/api/bookings"

const DEPOSIT_TYPES = ["none", "fixed", "percent"] as const
const PAYMENT_MODES = ["pay_now", "pay_later", "deposit"] as const

const ServiceEditSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  description: zod.string().optional(),
  duration_minutes: zod.coerce.number().min(1),
  buffer_minutes: zod.coerce.number().min(0).optional(),
  price: zod.coerce.number().min(0).optional(),
  currency_code: zod.string().optional(),
  deposit_type: zod.enum(DEPOSIT_TYPES),
  deposit_value: zod.coerce.number().optional(),
  payment_modes_allowed: zod.array(zod.enum(PAYMENT_MODES)),
  is_active: zod.boolean(),
})

export const ServiceEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { handleSuccess } = useRouteModal()

  const { service, isLoading } = useBookingService(id!)
  const { mutateAsync: updateService, isPending } = useUpdateBookingService(id!)

  const form = useForm<zod.infer<typeof ServiceEditSchema>>({
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 60,
      buffer_minutes: 0,
      price: undefined,
      currency_code: "usd",
      deposit_type: "none",
      deposit_value: undefined,
      payment_modes_allowed: ["pay_now"],
      is_active: true,
    },
    values: service
      ? {
          name: service.name,
          description: service.description || "",
          duration_minutes: service.duration_minutes,
          buffer_minutes: service.buffer_minutes || 0,
          price: service.price ? service.price / 100 : undefined,
          currency_code: service.currency_code || "usd",
          deposit_type: service.deposit_type || "none",
          deposit_value: service.deposit_value
            ? service.deposit_type === "fixed"
              ? service.deposit_value / 100
              : service.deposit_value
            : undefined,
          payment_modes_allowed:
            (service.payment_modes_allowed as typeof PAYMENT_MODES[number][]) || ["pay_now"],
          is_active: service.is_active,
        }
      : undefined,
    resolver: zodResolver(ServiceEditSchema),
  })

  const depositType = form.watch("deposit_type")

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateService(
      {
        name: data.name,
        description: data.description || undefined,
        duration_minutes: data.duration_minutes,
        buffer_minutes: data.buffer_minutes || undefined,
        price: data.price ? Math.round(data.price * 100) : undefined,
        currency_code: data.currency_code || undefined,
        deposit_type: data.deposit_type,
        deposit_value:
          data.deposit_type === "none"
            ? undefined
            : data.deposit_type === "fixed"
              ? Math.round((data.deposit_value || 0) * 100)
              : data.deposit_value,
        payment_modes_allowed: data.payment_modes_allowed,
        is_active: data.is_active,
      },
      {
        onSuccess: () => {
          toast.success(t("bookings.services.edit.successToast"))
          handleSuccess()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  if (isLoading || !service) {
    return null
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-col items-center py-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div>
            <Heading>{t("bookings.services.edit.header")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("bookings.services.edit.hint")}
            </Text>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("bookings.services.fields.name")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <Form.Item>
                      <div className="flex items-center justify-between">
                        <Form.Label>{t("bookings.services.fields.active")}</Form.Label>
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
              </div>

              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("bookings.services.fields.description")}
                    </Form.Label>
                    <Form.Control>
                      <Textarea {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t("bookings.services.fields.duration")}
                      </Form.Label>
                      <Form.Control>
                        <Input type="number" min={1} {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="buffer_minutes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("bookings.services.fields.buffer")}
                      </Form.Label>
                      <Form.Control>
                        <Input type="number" min={0} {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("bookings.services.fields.price")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="currency_code"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("bookings.services.fields.currency")}
                      </Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="usd">USD</Select.Item>
                            <Select.Item value="eur">EUR</Select.Item>
                            <Select.Item value="gbp">GBP</Select.Item>
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="deposit_type"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t("bookings.services.fields.depositType")}
                      </Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {DEPOSIT_TYPES.map((type) => (
                              <Select.Item key={type} value={type}>
                                {t(`bookings.services.depositTypes.${type}`)}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                {depositType !== "none" && (
                  <Form.Field
                    control={form.control}
                    name="deposit_value"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {depositType === "fixed"
                            ? t("bookings.services.fields.depositAmount")
                            : t("bookings.services.fields.depositPercent")}
                        </Form.Label>
                        <Form.Control>
                          <Input
                            type="number"
                            step={depositType === "fixed" ? "0.01" : "1"}
                            min={0}
                            max={depositType === "percent" ? 100 : undefined}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                )}
              </div>

              <Form.Field
                control={form.control}
                name="payment_modes_allowed"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("bookings.services.fields.paymentModes")}
                    </Form.Label>
                    <div className="flex flex-col gap-y-2 mt-2">
                      {PAYMENT_MODES.map((mode) => (
                        <div key={mode} className="flex items-center gap-x-2">
                          <Checkbox
                            id={mode}
                            checked={field.value?.includes(mode)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, mode])
                              } else {
                                field.onChange(
                                  field.value.filter((m) => m !== mode)
                                )
                              }
                            }}
                          />
                          <label htmlFor={mode} className="text-sm">
                            {t(`bookings.paymentModes.${mode}`)}
                          </label>
                        </div>
                      ))}
                    </div>
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
