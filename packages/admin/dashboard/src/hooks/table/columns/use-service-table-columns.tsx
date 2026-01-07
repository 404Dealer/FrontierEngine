import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Text } from "@medusajs/ui"
import { AdminBookingService } from "../../api/bookings"

const columnHelper = createColumnHelper<AdminBookingService>()

const formatCurrency = (
  amount: string | number | null,
  currencyCode: string
): string => {
  if (amount === null || amount === undefined) {
    return "-"
  }
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(numAmount)
}

export const useServiceTableColumns = () => {
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
      columnHelper.accessor("duration_minutes", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.services.fields.durationMinutes")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small">{getValue()} min</Text>
        ),
      }),
      columnHelper.accessor("buffer_minutes", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.services.fields.bufferMinutes")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small">{getValue()} min</Text>
        ),
      }),
      columnHelper.display({
        id: "price",
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.services.fields.price")}
          </Text>
        ),
        cell: ({ row }) => (
          <Text size="small">
            {formatCurrency(row.original.price, row.original.currency_code)}
          </Text>
        ),
      }),
      columnHelper.accessor("deposit_type", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.services.fields.depositType")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small">
            {t(`bookings.services.depositType.${getValue()}`)}
          </Text>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: () => (
          <Text size="small" weight="plus">
            {t("bookings.services.fields.isActive")}
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
