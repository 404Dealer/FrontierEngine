import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminBooking } from "../../../../../hooks/api/bookings"

type BookingCustomerSectionProps = {
  booking: AdminBooking
}

export const BookingCustomerSection = ({
  booking,
}: BookingCustomerSectionProps) => {
  const { t } = useTranslation()

  const hasCustomerInfo =
    booking.customer_name || booking.customer_email || booking.customer_phone

  if (!hasCustomerInfo && !booking.customer_id) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("bookings.fields.customer")}</Heading>
      </div>

      {booking.customer_name && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.name")}
          </Text>
          <Text size="small" leading="compact">
            {booking.customer_name}
          </Text>
        </div>
      )}

      {booking.customer_email && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.email")}
          </Text>
          <Text size="small" leading="compact">
            {booking.customer_email}
          </Text>
        </div>
      )}

      {booking.customer_phone && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.phone")}
          </Text>
          <Text size="small" leading="compact">
            {booking.customer_phone}
          </Text>
        </div>
      )}

      {booking.customer_id && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Customer ID
          </Text>
          <Text size="small" leading="compact" className="font-mono">
            {booking.customer_id}
          </Text>
        </div>
      )}
    </Container>
  )
}
