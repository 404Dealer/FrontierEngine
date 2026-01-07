import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const OrderBooking: ModuleJoinerConfig = {
  serviceName: LINKS.OrderBooking,
  isLink: true,
  databaseConfig: {
    tableName: "order_booking",
    idPrefix: "ordbk",
  },
  alias: [
    {
      name: ["order_booking", "order_bookings"],
      entity: "LinkOrderBooking",
    },
  ],
  primaryKeys: ["id", "order_id", "booking_id"],
  relationships: [
    {
      serviceName: Modules.ORDER,
      entity: "Order",
      primaryKey: "id",
      foreignKey: "order_id",
      alias: "order",
      args: {
        methodSuffix: "Orders",
      },
    },
    {
      serviceName: Modules.BOOKING,
      entity: "Booking",
      primaryKey: "id",
      foreignKey: "booking_id",
      alias: "booking",
      args: {
        methodSuffix: "Bookings",
      },
    },
  ],
  extends: [
    {
      serviceName: Modules.ORDER,
      entity: "Order",
      fieldAlias: {
        booking: "booking_link.booking",
      },
      relationship: {
        serviceName: LINKS.OrderBooking,
        primaryKey: "order_id",
        foreignKey: "id",
        alias: "booking_link",
      },
    },
    {
      serviceName: Modules.BOOKING,
      entity: "Booking",
      fieldAlias: {
        order: "order_link.order",
      },
      relationship: {
        serviceName: LINKS.OrderBooking,
        primaryKey: "booking_id",
        foreignKey: "id",
        alias: "order_link",
      },
    },
  ],
}
