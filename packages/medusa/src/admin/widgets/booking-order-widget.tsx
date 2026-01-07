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

const BookingOrderWidget = ({ data }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/admin/bookings?order_id=${data.id}`, {
          credentials: "include",
        })
        const result = await response.json()
        if (result.bookings && result.bookings.length > 0) {
          setBooking(result.bookings[0])
        }
      } catch (error) {
        console.error("Failed to fetch booking:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [data.id])

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Booking Details</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-2">
            Loading...
          </Text>
        </div>
      </Container>
    )
  }

  if (!booking) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Booking Details</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Linked appointment for this order
          </Text>
        </div>
        <Link
          to={`/bookings/${booking.id}`}
          className="text-ui-fg-interactive text-sm hover:underline"
        >
          View booking
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div>
          <Text size="small" weight="plus">
            Booking ID
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            #{booking.display_id}
          </Text>
        </div>
        <div>
          <Text size="small" weight="plus">
            Status
          </Text>
          <Badge color={statusColors[booking.status] || "grey"}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div>
          <Text size="small" weight="plus">
            Service
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {booking.service_name}
          </Text>
        </div>
        <div>
          <Text size="small" weight="plus">
            Staff
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {booking.staff_name}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div>
          <Text size="small" weight="plus">
            Start
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {formatDate(booking.start_at)}
          </Text>
        </div>
        <div>
          <Text size="small" weight="plus">
            End
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {formatDate(booking.end_at)}
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default BookingOrderWidget
