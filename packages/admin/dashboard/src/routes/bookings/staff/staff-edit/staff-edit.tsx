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
import { useParams } from "react-router-dom"
import * as zod from "zod"

import { Form } from "../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../components/modals"
import {
  AdminBookingStaff,
  useBookingStaffMember,
  useUpdateBookingStaff,
} from "../../../../hooks/api/bookings"

const StaffEditSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  email: zod.string().email().optional().or(zod.literal("")),
  phone: zod.string().optional(),
  bio: zod.string().optional(),
  avatar_url: zod.string().url().optional().or(zod.literal("")),
  is_active: zod.boolean(),
})

export const StaffEdit = () => {
  const { id } = useParams()
  const { staff, isLoading } = useBookingStaffMember(id!)

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      {!isLoading && staff && <StaffEditForm staff={staff} />}
    </RouteFocusModal>
  )
}

type StaffEditFormProps = {
  staff: AdminBookingStaff
}

const StaffEditForm = ({ staff }: StaffEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { mutateAsync: updateStaff, isPending } = useUpdateBookingStaff(staff.id)

  const form = useForm<zod.infer<typeof StaffEditSchema>>({
    defaultValues: {
      name: staff.name,
      email: staff.email || "",
      phone: staff.phone || "",
      bio: staff.bio || "",
      avatar_url: staff.avatar_url || "",
      is_active: staff.is_active,
    },
    resolver: zodResolver(StaffEditSchema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateStaff(
      {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
        is_active: data.is_active,
      },
      {
        onSuccess: () => {
          toast.success(t("bookings.staff.edit.successToast"))
          handleSuccess()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Body className="flex flex-col items-center py-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div>
            <Heading>{t("bookings.staff.edit.header")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("bookings.staff.edit.hint")}
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
                      <Form.Label>{t("bookings.staff.fields.name")}</Form.Label>
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
                        <Form.Label>{t("bookings.staff.fields.active")}</Form.Label>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>{t("bookings.staff.fields.email")}</Form.Label>
                      <Form.Control>
                        <Input type="email" {...field} />
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
                      <Form.Label optional>{t("bookings.staff.fields.phone")}</Form.Label>
                      <Form.Control>
                        <Input type="tel" {...field} />
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
                      <Input type="url" {...field} />
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
  )
}
