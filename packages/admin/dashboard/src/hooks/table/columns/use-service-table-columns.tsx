import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Text } from "@medusajs/ui"
import { AdminBookingService } from "../../api/bookings"

const columnHelper = createColumnHelper<AdminBookingService>()

/**
 * Extract numeric value from various price formats (BigNumber, string, number)
 */
const extractPriceValue = (price: unknown): number => {
  if (price === null || price === undefined) return 0
  // Handle BigNumber object format {value: "3500"}
  if (typeof price === "object" && price !== null && "value" in price) {
    return parseFloat(String((price as { value: unknown }).value))
  }
  return typeof price === "string" ? parseFloat(price) : Number(price)
}

const formatCurrency = (
  amount: string | number | null,
  currencyCode: string
): string => {
  if (amount === null || amount === undefined) {
    return "-"
  }
  const numAmount = extractPriceValue(amount)
  // Convert from cents to dollars for display
  const dollars = numAmount / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(dollars)
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
