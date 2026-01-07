import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
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
import { useCreateBookingStaff } from "../../../../../../hooks/api/bookings"

const CreateStaffSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  email: zod.string().email().optional().or(zod.literal("")),
  phone: zod.string().optional(),
  bio: zod.string().optional(),
  avatar_url: zod.string().url().optional().or(zod.literal("")),
  is_active: zod.boolean(),
})

export const CreateStaffForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync, isPending } = useCreateBookingStaff()

  const form = useForm<zod.infer<typeof CreateStaffSchema>>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      bio: "",
      avatar_url: "",
      is_active: true,
    },
    resolver: zodResolver(CreateStaffSchema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
        is_active: data.is_active,
      },
      {
        onSuccess: ({ staff }) => {
          toast.success(
            t("bookings.staff.create.successToast", {
              name: staff.name,
            })
          )
          handleSuccess("/bookings/staff")
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
              <Heading>{t("bookings.staff.create.header")}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {t("bookings.staff.create.hint")}
              </Text>
            </div>

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
                      <Form.Label>{t("bookings.staff.fields.isActive")}</Form.Label>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="email"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.email")}</Form.Label>
                    <Form.Control>
                      <Input type="email" autoComplete="off" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.phone")}</Form.Label>
                    <Form.Control>
                      <Input type="tel" autoComplete="off" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            <Form.Field
              control={form.control}
              name="bio"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("bookings.staff.fields.bio")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("bookings.staff.fields.avatarUrl")}</Form.Label>
                  <Form.Control>
                    <Input type="url" autoComplete="off" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
