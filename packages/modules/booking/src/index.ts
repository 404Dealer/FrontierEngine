import { Module, Modules } from "@medusajs/framework/utils"
import { BookingModuleService } from "@services"

export default Module(Modules.BOOKING, {
  service: BookingModuleService,
})

export * from "./models"
export * from "./types"
