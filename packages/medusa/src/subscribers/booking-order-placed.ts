import {
  BookingStatus,
  IBookingModuleService,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

interface OrderPlacedData {
  id: string
}

/**
 * Subscriber that handles order.placed events for bookings.
 *
 * When an order is placed and contains a booking line item:
 * 1. Updates the booking status to CONFIRMED
 * 2. Creates a link between the Order and Booking
 */
export default async function bookingOrderPlacedHandler({
  event,
  container,
}: SubscriberArgs<OrderPlacedData>) {
  const orderId = event.data.id

  // Query order to find line items with booking metadata
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderResult = await query.graph({
    entity: "order",
    fields: ["id", "items.id", "items.metadata", "total"],
    filters: { id: orderId },
  })

  const order = orderResult.data[0]
  if (!order?.items?.length) {
    return
  }

  // Find line item with booking_id in metadata
  const bookingItem = order.items.find(
    (item: { metadata?: Record<string, unknown> }) => item.metadata?.booking_id
  )

  if (!bookingItem) {
    // Not a booking order, skip
    return
  }

  const bookingId = bookingItem.metadata.booking_id as string

  // 1. Update booking to CONFIRMED status
  const bookingModule = container.resolve<IBookingModuleService>(
    Modules.BOOKING
  )

  await bookingModule.updateBookingRecords([
    {
      id: bookingId,
      status: BookingStatus.CONFIRMED,
      confirmed_at: new Date(),
      hold_expires_at: null,
      amount_paid: order.total,
    },
  ])

  // 2. Create Order <-> Booking link
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)

  await remoteLink.create([
    {
      [Modules.ORDER]: { order_id: orderId },
      [Modules.BOOKING]: { booking_id: bookingId },
    },
  ])
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
  context: {
    subscriberId: "booking-order-placed-handler",
  },
}
