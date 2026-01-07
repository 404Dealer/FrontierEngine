import {
  BookingStatus,
  IBookingModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Scheduled job that expires held bookings that have passed their hold expiration time.
 * Runs every 5 minutes to clean up abandoned booking holds and release the time slots.
 *
 * When a booking is held (status: "held"), it has a hold_expires_at timestamp.
 * Once that timestamp passes, the booking should be deleted to free up the slot.
 */
export default async function expireHeldBookings(
  container: MedusaContainer
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const bookingModule =
    container.resolve<IBookingModuleService>(Modules.BOOKING)

  try {
    // Find all bookings that are held and have expired
    const expiredHolds = await bookingModule.listBookingRecords({
      status: BookingStatus.HELD,
      hold_expires_at: { $lt: new Date() },
    })

    if (expiredHolds.length === 0) {
      logger.debug("[expire-held-bookings] No expired bookings found")
      return
    }

    // Delete expired holds to release the time slots
    const expiredIds = expiredHolds.map((b) => b.id)
    await bookingModule.deleteBookingRecords(expiredIds)

    logger.info(
      `[expire-held-bookings] Deleted ${expiredHolds.length} expired holds: ${expiredIds.join(", ")}`
    )
  } catch (error) {
    logger.error(
      `[expire-held-bookings] Error expiring held bookings: ${error.message}`
    )
    throw error
  }
}

export const config = {
  name: "expire-held-bookings",
  // Run every 5 minutes
  schedule: "*/5 * * * *",
}
