import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Checkbox,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useCreateBookingService } from "../../../../../../hooks/api/bookings"
import { useSalesChannels } from "../../../../../../hooks/api/sales-channels"

const CreateServiceSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  description: zod.string().optional(),
  duration_minutes: zod.coerce.number().min(1, "Duration must be at least 1 minute"),
  buffer_minutes: zod.coerce.number().min(0),
  price: zod.coerce.number().min(0),
  currency_code: zod.string().default("usd"),
  sales_channel_id: zod.string().optional(),
  deposit_type: zod.enum(["none", "fixed", "percent"]),
  deposit_value: zod.coerce.number().optional(),
  payment_modes_in_person: zod.boolean(),
  payment_modes_online: zod.boolean(),
  is_active: zod.boolean(),
})

export const CreateServiceForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync, isPending } = useCreateBookingService()
  const { sales_channels, isLoading: isSalesChannelsLoading } = useSalesChannels({ limit: 100 })

  const form = useForm<zod.infer<typeof CreateServiceSchema>>({
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 60,
      buffer_minutes: 0,
      price: 0,
      currency_code: "usd",
      sales_channel_id: undefined,
      deposit_type: "none",
      deposit_value: undefined,
      payment_modes_in_person: true,
      payment_modes_online: true,
      is_active: true,
    },
    resolver: zodResolver(CreateServiceSchema),
  })

  const depositType = form.watch("deposit_type")

  const handleSubmit = form.handleSubmit(async (data) => {
    const paymentModesAllowed: string[] = []
    if (data.payment_modes_in_person) {
      paymentModesAllowed.push("in_person")
    }
    if (data.payment_modes_online) {
      paymentModesAllowed.push("online")
    }

    await mutateAsync(
      {
        name: data.name,
        description: data.description || undefined,
        duration_minutes: data.duration_minutes,
        buffer_minutes: data.buffer_minutes,
        price: Math.round(data.price * 100), // Convert dollars to cents
        currency_code: data.currency_code,
        sales_channel_id: data.sales_channel_id || undefined,
        deposit_type: data.deposit_type,
        deposit_value:
          data.deposit_type === "none"
            ? undefined
            : data.deposit_type === "fixed"
              ? Math.round((data.deposit_value || 0) * 100) // Convert dollars to cents for fixed deposits
              : data.deposit_value, // Percentage stays as-is
        payment_modes_allowed: paymentModesAllowed,
        is_active: data.is_active,
      },
      {
        onSuccess: ({ service }) => {
          toast.success(
            t("bookings.services.create.successToast", {
              name: service.name,
            })
          )
          handleSuccess("/bookings/services")
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <Heading>{t("bookings.services.create.header")}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {t("bookings.services.create.hint")}
              </Text>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("fields.name")}</Form.Label>
                    <Form.Control>
                      <Input autoComplete="off" {...field} />
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
                      <Form.Label>{t("bookings.services.fields.isActive")}</Form.Label>
                      <Form.Control>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Duration & Buffer */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("bookings.services.fields.durationMinutes")}
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
                      {t("bookings.services.fields.bufferMinutes")}
                    </Form.Label>
                    <Form.Control>
                      <Input type="number" min={0} {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("bookings.services.fields.price")}</Form.Label>
                    <Form.Control>
                      <Input type="number" min={0} step="0.01" {...field} />
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
                    <Form.Label>
                      {t("bookings.services.fields.currencyCode")}
                    </Form.Label>
                    <Form.Control>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="usd">USD</Select.Item>
                          <Select.Item value="eur">EUR</Select.Item>
                          <Select.Item value="gbp">GBP</Select.Item>
                          <Select.Item value="cad">CAD</Select.Item>
                          <Select.Item value="aud">AUD</Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            {/* Sales Channel */}
            <Form.Field
              control={form.control}
              name="sales_channel_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("bookings.services.fields.salesChannel")}
                  </Form.Label>
                  <Form.Hint>
                    {t("bookings.services.fields.salesChannelHint")}
                  </Form.Hint>
                  <Form.Control>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isSalesChannelsLoading}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder={t("bookings.services.fields.salesChannelPlaceholder")} />
                      </Select.Trigger>
                      <Select.Content>
                        {sales_channels?.map((channel) => (
                          <Select.Item key={channel.id} value={channel.id}>
                            {channel.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Deposit Settings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="deposit_type"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("bookings.services.fields.depositType")}</Form.Label>
                    <Form.Control>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="none">
                            {t("bookings.services.depositType.none")}
                          </Select.Item>
                          <Select.Item value="fixed">
                            {t("bookings.services.depositType.fixed")}
                          </Select.Item>
                          <Select.Item value="percent">
                            {t("bookings.services.depositType.percent")}
                          </Select.Item>
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
                        {t("bookings.services.fields.depositValue")}
                        {depositType === "percent" ? " (%)" : ""}
                      </Form.Label>
                      <Form.Control>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              )}
            </div>

            {/* Payment Modes */}
            <div>
              <Label className="mb-2 block">
                {t("bookings.services.fields.paymentModesAllowed")}
              </Label>
              <div className="flex gap-4">
                <Form.Field
                  control={form.control}
                  name="payment_modes_in_person"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label>{t("bookings.paymentMode.pay_in_store")}</Label>
                    </div>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="payment_modes_online"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label>Online</Label>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              variant="primary"
              type="submit"
              isLoading={isPending}
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
