import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import * as QueryConfig from "./query-config"
import {
  StoreGetServicesParams,
  StoreGetAvailabilityParams,
  StoreHoldBooking,
  StoreConfirmBooking,
  StoreCancelBooking,
} from "./validators"

export const storeBookingRoutesMiddlewares: MiddlewareRoute[] = [
  // Services routes
  {
    method: ["GET"],
    matcher: "/store/bookings/services",
    middlewares: [
      validateAndTransformQuery(
        StoreGetServicesParams,
        QueryConfig.QueryConfig.listServicesTransformQueryConfig
      ),
    ],
  },
  // Availability routes
  {
    method: ["GET"],
    matcher: "/store/bookings/availability",
    middlewares: [
      validateAndTransformQuery(
        StoreGetAvailabilityParams,
        {}
      ),
    ],
  },
  // Hold booking route
  {
    method: ["POST"],
    matcher: "/store/bookings",
    middlewares: [validateAndTransformBody(StoreHoldBooking)],
  },
  // Get customer bookings
  {
    method: ["GET"],
    matcher: "/store/bookings",
    middlewares: [],
  },
  // Get booking by ID
  {
    method: ["GET"],
    matcher: "/store/bookings/:id",
    middlewares: [],
  },
  // Confirm booking
  {
    method: ["POST"],
    matcher: "/store/bookings/:id/confirm",
    middlewares: [validateAndTransformBody(StoreConfirmBooking)],
  },
  // Cancel booking
  {
    method: ["POST"],
    matcher: "/store/bookings/:id/cancel",
    middlewares: [validateAndTransformBody(StoreCancelBooking)],
  },
]
