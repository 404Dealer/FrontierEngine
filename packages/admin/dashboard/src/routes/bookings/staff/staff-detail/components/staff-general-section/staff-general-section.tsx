import { PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import {
  AdminBookingStaff,
  useDeleteBookingStaff,
} from "../../../../../../hooks/api/bookings"

type StaffGeneralSectionProps = {
  staff: AdminBookingStaff
}

export const StaffGeneralSection = ({ staff }: StaffGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync: deleteStaff } = useDeleteBookingStaff(staff.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("bookings.staff.delete.title"),
      description: t("bookings.staff.delete.description", {
        name: staff.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteStaff(undefined, {
      onSuccess: () => {
        toast.success(
          t("bookings.staff.delete.successToast", {
            name: staff.name,
          })
        )
        navigate("/bookings/staff", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading>{staff.name}</Heading>
          <Badge color={staff.is_active ? "green" : "grey"} size="small">
            {staff.is_active ? t("general.active") : t("general.disabled")}
          </Badge>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "edit",
                },
              ],
            },
            {
              actions: [
                {
                  label: t("actions.delete"),
                  icon: <Trash />,
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>

      {staff.email && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.email")}
          </Text>
          <Text size="small" leading="compact">
            {staff.email}
          </Text>
        </div>
      )}

      {staff.phone && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.phone")}
          </Text>
          <Text size="small" leading="compact">
            {staff.phone}
          </Text>
        </div>
      )}

      {staff.bio && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.staff.fields.bio")}
          </Text>
          <Text size="small" leading="compact">
            {staff.bio}
          </Text>
        </div>
      )}
    </Container>
  )
}
