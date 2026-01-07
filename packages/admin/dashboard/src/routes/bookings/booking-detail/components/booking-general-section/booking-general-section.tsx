import {
  CheckCircle,
  PencilSquare,
  Trash,
  XCircle,
  XMark,
} from "@medusajs/icons"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import {
  AdminBooking,
  useDeleteBooking,
  useUpdateBooking,
} from "../../../../../hooks/api/bookings"

type BookingGeneralSectionProps = {
  booking: AdminBooking
}

const getStatusColor = (
  status: string
): "green" | "red" | "orange" | "blue" | "grey" | "purple" => {
  switch (status) {
    case "confirmed":
      return "green"
    case "completed":
      return "blue"
    case "cancelled":
      return "red"
    case "no_show":
      return "orange"
    case "held":
    default:
      return "grey"
  }
}

export const BookingGeneralSection = ({
  booking,
}: BookingGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync: deleteBooking } = useDeleteBooking(booking.id)
  const { mutateAsync: updateBooking } = useUpdateBooking(booking.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("bookings.delete.title"),
      description: t("bookings.delete.description", {
        displayId: booking.display_id,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteBooking(undefined, {
      onSuccess: () => {
        toast.success(
          t("bookings.delete.successToast", {
            displayId: booking.display_id,
          })
        )
        navigate("/bookings", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const handleStatusChange = async (
    newStatus: "confirmed" | "completed" | "cancelled" | "no_show"
  ) => {
    const statusUpdate: Record<string, any> = { status: newStatus }

    if (newStatus === "confirmed") {
      statusUpdate.confirmed_at = new Date().toISOString()
    } else if (newStatus === "completed") {
      statusUpdate.completed_at = new Date().toISOString()
    } else if (newStatus === "cancelled") {
      statusUpdate.cancelled_at = new Date().toISOString()
    }

    await updateBooking(statusUpdate, {
      onSuccess: () => {
        toast.success(
          t("bookings.edit.successToast", {
            displayId: booking.display_id,
          })
        )
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const statusActions = []

  if (booking.status === "held") {
    statusActions.push({
      label: t("bookings.actions.confirm"),
      icon: <CheckCircle />,
      onClick: () => handleStatusChange("confirmed"),
    })
  }

  if (booking.status === "confirmed") {
    statusActions.push(
      {
        label: t("bookings.actions.complete"),
        icon: <CheckCircle />,
        onClick: () => handleStatusChange("completed"),
      },
      {
        label: t("bookings.actions.noShow"),
        icon: <XMark />,
        onClick: () => handleStatusChange("no_show"),
      }
    )
  }

  if (booking.status !== "cancelled" && booking.status !== "completed") {
    statusActions.push({
      label: t("bookings.actions.cancel"),
      icon: <XCircle />,
      onClick: () => handleStatusChange("cancelled"),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading>#{booking.display_id}</Heading>
          <Badge color={getStatusColor(booking.status)} size="small">
            {t(`bookings.status.${booking.status}`)}
          </Badge>
        </div>
        <ActionMenu
          groups={[
            ...(statusActions.length > 0
              ? [
                  {
                    actions: statusActions,
                  },
                ]
              : []),
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

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("bookings.fields.service")}
        </Text>
        <Text size="small" leading="compact">
          {booking.service_name || "-"}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("bookings.fields.staff")}
        </Text>
        <Text size="small" leading="compact">
          {booking.staff?.name || "-"}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("bookings.fields.date")}
        </Text>
        <Text size="small" leading="compact">
          {booking.start_at
            ? format(new Date(booking.start_at), "MMM d, yyyy")
            : "-"}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("bookings.fields.time")}
        </Text>
        <Text size="small" leading="compact">
          {booking.start_at && booking.end_at
            ? `${format(new Date(booking.start_at), "h:mm a")} - ${format(
                new Date(booking.end_at),
                "h:mm a"
              )}`
            : "-"}
        </Text>
      </div>

      {booking.notes && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.fields.notes")}
          </Text>
          <Text size="small" leading="compact">
            {booking.notes}
          </Text>
        </div>
      )}

      {booking.internal_notes && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.fields.internalNotes")}
          </Text>
          <Text size="small" leading="compact">
            {booking.internal_notes}
          </Text>
        </div>
      )}
    </Container>
  )
}
