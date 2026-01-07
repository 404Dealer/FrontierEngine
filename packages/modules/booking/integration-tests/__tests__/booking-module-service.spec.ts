import { Module, Modules } from "@medusajs/framework/utils"
import { BookingModuleService } from "@services"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createServiceFixture,
  createStaffFixture,
  createAvailabilityRuleFixture,
  createBookingFixture,
} from "../__fixtures__"

jest.setTimeout(100000)

moduleIntegrationTestRunner<BookingModuleService>({
  moduleName: Modules.BOOKING,
  testSuite: ({ service }) => {
    it(`should export the appropriate linkable configuration`, () => {
      const linkable = Module(Modules.BOOKING, {
        service: BookingModuleService,
      }).linkable

      expect(Object.keys(linkable)).toEqual(
        expect.arrayContaining(["booking", "staff", "service"])
      )
    })

    describe("Booking Module Service", () => {
      describe("creating a service", () => {
        it("should create a service successfully", async function () {
          const [createdService] = await service.createBookingServices([
            createServiceFixture,
          ])

          expect(createdService).toEqual(
            expect.objectContaining({
              name: "Haircut",
              description: "Standard men's haircut",
              duration_minutes: 30,
              buffer_minutes: 5,
              currency_code: "usd",
              is_active: true,
            })
          )
          expect(createdService.id).toBeDefined()
        })
      })

      describe("creating staff", () => {
        it("should create staff successfully", async function () {
          const [createdStaff] = await service.createBookingStaffs([createStaffFixture])

          expect(createdStaff).toEqual(
            expect.objectContaining({
              name: "John Barber",
              email: "john@barbershop.com",
              is_active: true,
            })
          )
          expect(createdStaff.id).toBeDefined()
        })
      })

      describe("creating availability rules", () => {
        it("should create availability rule for staff", async function () {
          const [staff] = await service.createBookingStaffs([createStaffFixture])

          const [rule] = await service.createBookingAvailabilityRules([
            {
              ...createAvailabilityRuleFixture,
              staff_id: staff.id,
            },
          ])

          expect(rule).toEqual(
            expect.objectContaining({
              rule_type: "recurring",
              day_of_week: 1,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            })
          )
          expect(rule.id).toBeDefined()
        })
      })

      describe("creating bookings", () => {
        it("should create a booking successfully", async function () {
          const [staff] = await service.createBookingStaffs([createStaffFixture])
          const [svc] = await service.createBookingServices([createServiceFixture])

          const [booking] = await service.createBookingRecords([
            {
              ...createBookingFixture,
              service_id: svc.id,
              staff_id: staff.id,
            },
          ])

          expect(booking).toEqual(
            expect.objectContaining({
              service_id: svc.id,
              customer_email: "customer@example.com",
              customer_name: "Test Customer",
              status: "held",
            })
          )
          expect(booking.id).toBeDefined()
        })
      })

      describe("booking settings", () => {
        it("should return default settings when none exist", async function () {
          const settings = await service.getSettings()

          expect(settings).toEqual(
            expect.objectContaining({
              allow_guest_bookings: true,
              default_hold_duration_minutes: 10,
              cancellation_window_hours: 2,
              timezone: "America/New_York",
            })
          )
        })

        it("should update settings successfully", async function () {
          await service.getSettings() // Ensure settings exist

          const updatedSettings = await service.updateSettings({
            allow_guest_bookings: false,
            cancellation_window_hours: 4,
          })

          expect(updatedSettings).toEqual(
            expect.objectContaining({
              allow_guest_bookings: false,
              cancellation_window_hours: 4,
            })
          )
        })
      })

      describe("seed default data", () => {
        it("should seed default staff and settings", async function () {
          const { staff, settings } = await service.seedDefaultData()

          expect(staff).toEqual(
            expect.objectContaining({
              name: "Default Barber",
              is_active: true,
            })
          )

          expect(settings).toEqual(
            expect.objectContaining({
              allow_guest_bookings: true,
            })
          )
        })
      })

      describe("listing and retrieving", () => {
        it("should list all services", async function () {
          await service.createBookingServices([
            createServiceFixture,
            { ...createServiceFixture, name: "Beard Trim" },
          ])

          const services = await service.listBookingServices()
          expect(services).toHaveLength(2)
        })

        it("should list all staff", async function () {
          await service.createBookingStaffs([
            createStaffFixture,
            { ...createStaffFixture, name: "Jane Barber" },
          ])

          const staffList = await service.listBookingStaffs()
          expect(staffList).toHaveLength(2)
        })

        it("should retrieve a specific booking", async function () {
          const [staff] = await service.createBookingStaffs([createStaffFixture])
          const [svc] = await service.createBookingServices([createServiceFixture])
          const [booking] = await service.createBookingRecords([
            {
              ...createBookingFixture,
              service_id: svc.id,
              staff_id: staff.id,
            },
          ])

          const retrieved = await service.retrieveBookingRecord(booking.id)
          expect(retrieved.id).toEqual(booking.id)
        })
      })

      describe("updating entities", () => {
        it("should update a service", async function () {
          const [createdService] = await service.createBookingServices([
            createServiceFixture,
          ])

          const [updated] = await service.updateBookingServices([
            {
              id: createdService.id,
              name: "Premium Haircut",
              price: 35,
            },
          ])

          expect(updated.name).toEqual("Premium Haircut")
        })

        it("should update staff", async function () {
          const [createdStaff] = await service.createBookingStaffs([createStaffFixture])

          const [updated] = await service.updateBookingStaffs([
            {
              id: createdStaff.id,
              bio: "Updated bio",
            },
          ])

          expect(updated.bio).toEqual("Updated bio")
        })

        it("should update booking status", async function () {
          const [staff] = await service.createBookingStaffs([createStaffFixture])
          const [svc] = await service.createBookingServices([createServiceFixture])
          const [booking] = await service.createBookingRecords([
            {
              ...createBookingFixture,
              service_id: svc.id,
              staff_id: staff.id,
            },
          ])

          const [updated] = await service.updateBookingRecords([
            {
              id: booking.id,
              status: "confirmed",
              confirmed_at: new Date(),
            },
          ])

          expect(updated.status).toEqual("confirmed")
        })
      })

      describe("deleting entities", () => {
        it("should delete a service", async function () {
          const [createdService] = await service.createBookingServices([
            createServiceFixture,
          ])

          await service.deleteBookingServices([createdService.id])

          const services = await service.listBookingServices()
          expect(services).toHaveLength(0)
        })

        it("should delete staff", async function () {
          const [createdStaff] = await service.createBookingStaffs([createStaffFixture])

          await service.deleteBookingStaffs([createdStaff.id])

          const staffList = await service.listBookingStaffs()
          expect(staffList).toHaveLength(0)
        })
      })
    })
  },
})
