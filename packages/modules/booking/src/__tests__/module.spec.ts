import { Module, Modules } from "@medusajs/framework/utils"
import { BookingModuleService } from "@services"
import {
  BookingService,
  BookingStaff,
  BookingRecord,
  BookingAvailabilityRule,
  BookingSettings,
  DepositType,
  BookingStatus,
  PaymentMode,
  DayOfWeek,
  RuleType,
} from "@models"
import {
  ServiceDTO,
  StaffDTO,
  BookingDTO,
  AvailabilityRuleDTO,
  BookingSettingsDTO,
} from "@types"

describe("Booking Module", () => {
  describe("Module Definition", () => {
    it("should define the BOOKING module constant", () => {
      expect(Modules.BOOKING).toBe("booking")
    })

    it("should create a valid module definition", () => {
      const bookingModule = Module(Modules.BOOKING, {
        service: BookingModuleService,
      })

      expect(bookingModule).toBeDefined()
      expect(bookingModule.service).toBe(BookingModuleService)
    })
  })

  describe("Models", () => {
    it("should export BookingService model", () => {
      expect(BookingService).toBeDefined()
    })

    it("should export BookingStaff model", () => {
      expect(BookingStaff).toBeDefined()
    })

    it("should export BookingRecord model", () => {
      expect(BookingRecord).toBeDefined()
    })

    it("should export BookingAvailabilityRule model", () => {
      expect(BookingAvailabilityRule).toBeDefined()
    })

    it("should export BookingSettings model", () => {
      expect(BookingSettings).toBeDefined()
    })
  })

  describe("Enums", () => {
    it("should export DepositType enum with correct values", () => {
      expect(DepositType.NONE).toBe("none")
      expect(DepositType.FIXED).toBe("fixed")
      expect(DepositType.PERCENT).toBe("percent")
    })

    it("should export BookingStatus enum with correct values", () => {
      expect(BookingStatus.HELD).toBe("held")
      expect(BookingStatus.CONFIRMED).toBe("confirmed")
      expect(BookingStatus.CANCELLED).toBe("cancelled")
      expect(BookingStatus.COMPLETED).toBe("completed")
      expect(BookingStatus.NO_SHOW).toBe("no_show")
    })

    it("should export PaymentMode enum with correct values", () => {
      expect(PaymentMode.PAY_IN_STORE).toBe("pay_in_store")
      expect(PaymentMode.DEPOSIT).toBe("deposit")
      expect(PaymentMode.FULL).toBe("full")
    })

    it("should export DayOfWeek enum with correct values", () => {
      expect(DayOfWeek.MONDAY).toBe(0)
      expect(DayOfWeek.TUESDAY).toBe(1)
      expect(DayOfWeek.WEDNESDAY).toBe(2)
      expect(DayOfWeek.THURSDAY).toBe(3)
      expect(DayOfWeek.FRIDAY).toBe(4)
      expect(DayOfWeek.SATURDAY).toBe(5)
      expect(DayOfWeek.SUNDAY).toBe(6)
    })

    it("should export RuleType enum with correct values", () => {
      expect(RuleType.RECURRING).toBe("recurring")
      expect(RuleType.EXCEPTION).toBe("exception")
      expect(RuleType.BLOCKED).toBe("blocked")
    })
  })

  describe("Type Exports", () => {
    it("should export ServiceDTO type", () => {
      const serviceDto: ServiceDTO = {
        id: "test-id",
        name: "Test Service",
        duration_minutes: 30,
        price: 25,
        currency_code: "usd",
        is_active: true,
      } as ServiceDTO
      expect(serviceDto.id).toBe("test-id")
    })

    it("should export StaffDTO type", () => {
      const staffDto: StaffDTO = {
        id: "test-id",
        name: "Test Staff",
        is_active: true,
      } as StaffDTO
      expect(staffDto.id).toBe("test-id")
    })

    it("should export BookingDTO type", () => {
      const bookingDto: BookingDTO = {
        id: "test-id",
        service_id: "service-id",
        start_at: new Date(),
        end_at: new Date(),
        status: "held",
      } as BookingDTO
      expect(bookingDto.id).toBe("test-id")
    })

    it("should export AvailabilityRuleDTO type", () => {
      const ruleDto: AvailabilityRuleDTO = {
        id: "test-id",
        rule_type: "recurring",
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      } as AvailabilityRuleDTO
      expect(ruleDto.id).toBe("test-id")
    })

    it("should export BookingSettingsDTO type", () => {
      const settingsDto: BookingSettingsDTO = {
        id: "test-id",
        allow_guest_bookings: true,
        default_hold_duration_minutes: 10,
        cancellation_window_hours: 2,
        timezone: "America/New_York",
      } as BookingSettingsDTO
      expect(settingsDto.id).toBe("test-id")
    })
  })

  describe("BookingModuleService", () => {
    it("should export BookingModuleService class", () => {
      expect(BookingModuleService).toBeDefined()
      expect(typeof BookingModuleService).toBe("function")
    })

    it("should have prototype methods for settings", () => {
      expect(BookingModuleService.prototype.getSettings).toBeDefined()
      expect(BookingModuleService.prototype.updateSettings).toBeDefined()
    })

    it("should have prototype method for seeding default data", () => {
      expect(BookingModuleService.prototype.seedDefaultData).toBeDefined()
    })
  })
})
