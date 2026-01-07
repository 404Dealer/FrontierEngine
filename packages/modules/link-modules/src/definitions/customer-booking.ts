import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const CustomerBooking: ModuleJoinerConfig = {
  serviceName: LINKS.CustomerBooking,
  isLink: true,
  databaseConfig: {
    tableName: "customer_booking",
    idPrefix: "custbk",
  },
  alias: [
    {
      name: ["customer_booking", "customer_bookings"],
      entity: "LinkCustomerBooking",
    },
  ],
  primaryKeys: ["id", "customer_id", "booking_id"],
  relationships: [
    {
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      primaryKey: "id",
      foreignKey: "customer_id",
      alias: "customer",
      args: {
        methodSuffix: "Customers",
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
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      fieldAlias: {
        bookings: {
          path: "booking_link.booking",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.CustomerBooking,
        primaryKey: "customer_id",
        foreignKey: "id",
        alias: "booking_link",
        isList: true,
      },
    },
    {
      serviceName: Modules.BOOKING,
      entity: "Booking",
      fieldAlias: {
        customer: "customer_link.customer",
      },
      relationship: {
        serviceName: LINKS.CustomerBooking,
        primaryKey: "booking_id",
        foreignKey: "id",
        alias: "customer_link",
      },
    },
  ],
}
