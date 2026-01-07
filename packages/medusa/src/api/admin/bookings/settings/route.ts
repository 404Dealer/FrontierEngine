import { IBookingModuleService } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminUpdateBookingSettingsType } from "../validators"

/**
 * @oas [get] /admin/bookings/settings
 * summary: Get Booking Settings
 * description: Retrieves the booking system settings.
 * x-authenticated: true
 * tags:
 *   - Booking Settings
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const settings = await bookingModule.getSettings()

  res.json({
    settings,
  })
}

/**
 * @oas [post] /admin/bookings/settings
 * summary: Update Booking Settings
 * description: Updates the booking system settings.
 * x-authenticated: true
 * tags:
 *   - Booking Settings
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBookingSettingsType>,
  res: MedusaResponse
) => {
  const bookingModule = req.scope.resolve<IBookingModuleService>(Modules.BOOKING)

  const settings = await bookingModule.updateSettings(req.validatedBody)

  res.json({
    settings,
  })
}
