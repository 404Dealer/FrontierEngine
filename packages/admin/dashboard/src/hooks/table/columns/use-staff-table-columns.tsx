import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Text } from "@medusajs/ui"
import { AdminBookingStaff } from "../../api/bookings"

const columnHelper = createColumnHelper<AdminBookingStaff>()

export const useStaffTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <Text size="small" weight="plus">
            {t("fields.name")}
          </Text>
        ),
        cell: ({ getValue }) => <Text size="small">{getValue()}</Text>,
      }),
      columnHelper.accessor("email", {
        header: () => (
          <Text size="small" weight="plus">
            {t("fields.email")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small" className="text-ui-fg-subtle">
            {getValue() || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("phone", {
        header: () => (
          <Text size="small" weight="plus">
            {t("fields.phone")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small" className="text-ui-fg-subtle">
            {getValue() || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.staff.fields.isActive")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Badge color={getValue() ? "green" : "grey"} size="xsmall">
            {getValue() ? t("general.active") : t("general.disabled")}
          </Badge>
        ),
      }),
    ],
    [t]
  )
}
