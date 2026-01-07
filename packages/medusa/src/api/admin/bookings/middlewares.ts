import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import * as QueryConfig from "./query-config"
import {
  AdminCreateAvailabilityRule,
  AdminCreateBooking,
  AdminCreateService,
  AdminCreateStaff,
  AdminGetAvailabilityRuleParams,
  AdminGetAvailabilityRulesParams,
  AdminGetBookingParams,
  AdminGetBookingsParams,
  AdminGetBookingSettingsParams,
  AdminGetServiceParams,
  AdminGetServicesParams,
  AdminGetStaffParams,
  AdminGetStaffsParams,
  AdminUpdateAvailabilityRule,
  AdminUpdateBooking,
  AdminUpdateBookingSettings,
  AdminUpdateService,
  AdminUpdateStaff,
} from "./validators"

export const adminBookingRoutesMiddlewares: MiddlewareRoute[] = [
  // -------------------- Bookings --------------------
  {
    method: ["GET"],
    matcher: "/admin/bookings",
    middlewares: [
      validateAndTransformQuery(
        AdminGetBookingsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings",
    middlewares: [
      validateAndTransformBody(AdminCreateBooking),
      validateAndTransformQuery(
        AdminGetBookingParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/bookings/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetBookingParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateBooking),
      validateAndTransformQuery(
        AdminGetBookingParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/bookings/:id",
    middlewares: [],
  },

  // -------------------- Services --------------------
  {
    method: ["GET"],
    matcher: "/admin/bookings/services",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServicesParams,
        QueryConfig.serviceListTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/services",
    middlewares: [
      validateAndTransformBody(AdminCreateService),
      validateAndTransformQuery(
        AdminGetServiceParams,
        QueryConfig.serviceRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/bookings/services/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServiceParams,
        QueryConfig.serviceRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/services/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateService),
      validateAndTransformQuery(
        AdminGetServiceParams,
        QueryConfig.serviceRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/bookings/services/:id",
    middlewares: [],
  },

  // -------------------- Staff --------------------
  {
    method: ["GET"],
    matcher: "/admin/bookings/staff",
    middlewares: [
      validateAndTransformQuery(
        AdminGetStaffsParams,
        QueryConfig.staffListTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/staff",
    middlewares: [
      validateAndTransformBody(AdminCreateStaff),
      validateAndTransformQuery(
        AdminGetStaffParams,
        QueryConfig.staffRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/bookings/staff/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetStaffParams,
        QueryConfig.staffRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/staff/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateStaff),
      validateAndTransformQuery(
        AdminGetStaffParams,
        QueryConfig.staffRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/bookings/staff/:id",
    middlewares: [],
  },

  // -------------------- Settings --------------------
  {
    method: ["GET"],
    matcher: "/admin/bookings/settings",
    middlewares: [
      validateAndTransformQuery(
        AdminGetBookingSettingsParams,
        QueryConfig.settingsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/settings",
    middlewares: [
      validateAndTransformBody(AdminUpdateBookingSettings),
      validateAndTransformQuery(
        AdminGetBookingSettingsParams,
        QueryConfig.settingsTransformQueryConfig
      ),
    ],
  },

  // -------------------- Availability Rules --------------------
  {
    method: ["GET"],
    matcher: "/admin/bookings/staff/:id/availability",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAvailabilityRulesParams,
        QueryConfig.availabilityRuleListTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/staff/:id/availability",
    middlewares: [
      validateAndTransformBody(AdminCreateAvailabilityRule),
      validateAndTransformQuery(
        AdminGetAvailabilityRuleParams,
        QueryConfig.availabilityRuleRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/bookings/staff/:id/availability/:ruleId",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAvailabilityRuleParams,
        QueryConfig.availabilityRuleRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/bookings/staff/:id/availability/:ruleId",
    middlewares: [
      validateAndTransformBody(AdminUpdateAvailabilityRule),
      validateAndTransformQuery(
        AdminGetAvailabilityRuleParams,
        QueryConfig.availabilityRuleRetrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/bookings/staff/:id/availability/:ruleId",
    middlewares: [],
  },
]
