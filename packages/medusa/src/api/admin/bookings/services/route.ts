import {
  CreateServiceDTO,
  IBookingModuleService,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateServiceType,
  AdminGetServicesParamsType,
} from "../validators"

/**
 * @oas [get] /admin/bookings/services
 * summary: List Booking Services
 * description: Lists all booking services with optional filtering.
 * x-authenticated: true
 * tags:
 *   - Booking Services
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetServicesParamsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const [services, count] = await bookingModule.listAndCountBookingServices(
    req.filterableFields,
    {
      skip: req.queryConfig.pagination?.skip,
      take: req.queryConfig.pagination?.take,
      select: req.queryConfig.fields as string[],
    }
  )

  res.json({
    services,
    count,
    offset: req.queryConfig.pagination?.skip ?? 0,
    limit: req.queryConfig.pagination?.take ?? 50,
  })
}

/**
 * @oas [post] /admin/bookings/services
 * summary: Create a Booking Service
 * description: Creates a new booking service.
 * x-authenticated: true
 * tags:
 *   - Booking Services
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateServiceType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const service = await bookingModule.createBookingServices(
    req.validatedBody as CreateServiceDTO
  )

  res.status(201).json({
    service,
  })
}
