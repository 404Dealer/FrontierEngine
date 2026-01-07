import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"

type BookingData = {
  id: string
  display_id: string
  status: string
  start_at: string
  end_at: string
  service_name: string
  staff_name: string
}

const statusColors: Record<string, "green" | "orange" | "blue" | "grey" | "red"> = {
  pending: "orange",
  held: "blue",
  confirmed: "green",
  completed: "green",
  cancelled: "grey",
  no_show: "red",
}

const BookingCustomerWidget = ({
  data,
}: DetailWidgetProps<HttpTypes.AdminCustomer>) => {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `/admin/bookings?customer_id=${data.id}&limit=10`,
          {
            credentials: "include",
          }
        )
        const result = await response.json()
        if (result.bookings) {
          setBookings(result.bookings)
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [data.id])

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Bookings</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-2">
            Loading...
          </Text>
        </div>
      </Container>
    )
  }

  if (bookings.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Bookings</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-2">
            No bookings found for this customer.
          </Text>
        </div>
      </Container>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      new Date(b.start_at) > new Date() &&
      !["cancelled", "completed", "no_show"].includes(b.status)
  )

  const pastBookings = bookings.filter(
    (b) =>
      new Date(b.start_at) <= new Date() ||
      ["completed", "cancelled", "no_show"].includes(b.status)
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Bookings</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Customer's appointment history
          </Text>
        </div>
        <Link
          to={`/bookings?customer_id=${data.id}`}
          className="text-ui-fg-interactive text-sm hover:underline"
        >
          View all
        </Link>
      </div>

      {upcomingBookings.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" className="mb-3">
            Upcoming
          </Text>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-lg border border-ui-border-base p-3 hover:bg-ui-bg-subtle-hover"
              >
                <div className="flex flex-col">
                  <Text size="small" weight="plus">
                    {booking.service_name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {formatDate(booking.start_at)} • {booking.staff_name}
                  </Text>
                </div>
                <Badge color={statusColors[booking.status] || "grey"}>
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" className="mb-3">
            Past
          </Text>
          <div className="space-y-3">
            {pastBookings.slice(0, 5).map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-lg border border-ui-border-base p-3 hover:bg-ui-bg-subtle-hover"
              >
                <div className="flex flex-col">
                  <Text size="small" weight="plus">
                    {booking.service_name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {formatDate(booking.start_at)} • {booking.staff_name}
                  </Text>
                </div>
                <Badge color={statusColors[booking.status] || "grey"}>
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default BookingCustomerWidget
