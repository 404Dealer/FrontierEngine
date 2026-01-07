import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Text } from "@medusajs/ui"
import { format } from "date-fns"
import { AdminBooking } from "../../api/bookings"

const columnHelper = createColumnHelper<AdminBooking>()

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

export const useBookingTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.displayId")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small" className="text-ui-fg-subtle">
            #{getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("start_at", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.date")}
          </Text>
        ),
        cell: ({ getValue, row }) => {
          const startAt = getValue()
          const endAt = row.original.end_at
          if (!startAt) return <Text size="small">-</Text>
          return (
            <div className="flex flex-col">
              <Text size="small">
                {format(new Date(startAt), "MMM d, yyyy")}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                {format(new Date(startAt), "h:mm a")} -{" "}
                {format(new Date(endAt), "h:mm a")}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("service_name", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.service")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small">{getValue() || "-"}</Text>
        ),
      }),
      columnHelper.display({
        id: "customer",
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.customer")}
          </Text>
        ),
        cell: ({ row }) => {
          const { customer_name, customer_email } = row.original
          if (!customer_name && !customer_email) {
            return <Text size="small" className="text-ui-fg-muted">-</Text>
          }
          return (
            <div className="flex flex-col">
              {customer_name && <Text size="small">{customer_name}</Text>}
              {customer_email && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {customer_email}
                </Text>
              )}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "staff",
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.staff")}
          </Text>
        ),
        cell: ({ row }) => {
          const staff = row.original.staff
          if (!staff) {
            return <Text size="small" className="text-ui-fg-muted">-</Text>
          }
          return <Text size="small">{staff.name}</Text>
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.fields.status")}
          </Text>
        ),
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <Badge color={getStatusColor(status)} size="xsmall">
              {t(`bookings.status.${status}`)}
            </Badge>
          )
        },
      }),
    ],
    [t]
  )
}
