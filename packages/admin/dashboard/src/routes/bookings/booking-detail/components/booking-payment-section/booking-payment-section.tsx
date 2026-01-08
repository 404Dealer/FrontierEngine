import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminBooking } from "../../../../../hooks/api/bookings"

type BookingPaymentSectionProps = {
  booking: AdminBooking
}

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
  // CACHE_BUST_v2: If you see this prefix, new code is running!
  if (amount === null || amount === undefined) {
    return "-"
  }
  const numAmount = extractPriceValue(amount)
  // Convert from cents to dollars for display
  const dollars = numAmount / 100
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(dollars)
  return `[v2] ${formatted}`
}

export const BookingPaymentSection = ({
  booking,
}: BookingPaymentSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("fields.payment")}</Heading>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("bookings.fields.price")}
        </Text>
        <Text size="small" leading="compact">
          {formatCurrency(booking.price_amount, booking.currency_code)}
        </Text>
      </div>

      {booking.deposit_amount && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.fields.depositAmount")}
          </Text>
          <Text size="small" leading="compact">
            {formatCurrency(booking.deposit_amount, booking.currency_code)}
          </Text>
        </div>
      )}

      {booking.payment_mode && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.fields.paymentMode")}
          </Text>
          <Text size="small" leading="compact">
            {t(`bookings.paymentMode.${booking.payment_mode}`)}
          </Text>
        </div>
      )}

      {booking.amount_paid !== null && booking.amount_paid !== undefined && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("bookings.fields.amountPaid")}
          </Text>
          <Text size="small" leading="compact">
            {formatCurrency(booking.amount_paid, booking.currency_code)}
          </Text>
        </div>
      )}
    </Container>
  )
}
