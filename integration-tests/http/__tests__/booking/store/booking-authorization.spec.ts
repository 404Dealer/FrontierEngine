import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { BookingStatus } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"
import { createAuthenticatedCustomer } from "../../../../modules/helpers/create-authenticated-customer"

jest.setTimeout(100000)

const env = {}

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Booking Store API Authorization", () => {
      let appContainer
      let storeHeaders
      let storeHeadersWithCustomer1
      let storeHeadersWithCustomer2
      let customer1
      let customer2
      let bookingService
      let staff
      let service
      let guestBooking
      let customer1Booking

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        // Create first authenticated customer
        const result1 = await createAuthenticatedCustomer(api, storeHeaders, {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        })
        customer1 = result1.customer
        storeHeadersWithCustomer1 = {
          headers: {
            ...storeHeaders.headers,
            authorization: `Bearer ${result1.jwt}`,
          },
        }

        // Create second authenticated customer
        const result2 = await createAuthenticatedCustomer(api, storeHeaders, {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        })
        customer2 = result2.customer
        storeHeadersWithCustomer2 = {
          headers: {
            ...storeHeaders.headers,
            authorization: `Bearer ${result2.jwt}`,
          },
        }

        // Get booking module service
        bookingService = appContainer.resolve(Modules.BOOKING)

        // Create staff member
        staff = await bookingService.createBookingStaffs({
          name: "Test Staff",
          email: "staff@test.com",
          is_active: true,
        })

        // Create service
        service = await bookingService.createBookingServices({
          name: "Test Service",
          price: 5000,
          currency_code: "usd",
          duration_minutes: 60,
          is_active: true,
        })

        // Create a guest booking (no customer_id)
        const guestStartAt = new Date()
        guestStartAt.setHours(guestStartAt.getHours() + 24)
        const guestEndAt = new Date(guestStartAt)
        guestEndAt.setMinutes(guestEndAt.getMinutes() + 60)

        guestBooking = await bookingService.createBookingRecords({
          staff_id: staff.id,
          service_id: service.id,
          customer_id: null, // Guest booking
          start_at: guestStartAt,
          end_at: guestEndAt,
          status: BookingStatus.CONFIRMED,
          service_name: service.name,
          price_amount: service.price,
          currency_code: service.currency_code,
          customer_email: "guest@example.com",
          customer_name: "Guest User",
        })

        // Create customer1's booking
        const customer1StartAt = new Date()
        customer1StartAt.setHours(customer1StartAt.getHours() + 48)
        const customer1EndAt = new Date(customer1StartAt)
        customer1EndAt.setMinutes(customer1EndAt.getMinutes() + 60)

        customer1Booking = await bookingService.createBookingRecords({
          staff_id: staff.id,
          service_id: service.id,
          customer_id: customer1.id, // Customer 1's booking
          start_at: customer1StartAt,
          end_at: customer1EndAt,
          status: BookingStatus.CONFIRMED,
          service_name: service.name,
          price_amount: service.price,
          currency_code: service.currency_code,
          customer_email: "john@example.com",
        })
      })

      describe("GET /store/bookings/:id Authorization (M6-T1, M6-T2, M6-T3)", () => {
        describe("Guest booking access", () => {
          it("M6-T2: should allow unauthenticated request to view guest booking", async () => {
            const response = await api.get(
              `/store/bookings/${guestBooking.id}`,
              storeHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking).toBeTruthy()
            expect(response.data.booking.id).toEqual(guestBooking.id)
            expect(response.data.booking.customer_email).toEqual("guest@example.com")
          })

          it("should allow any authenticated customer to view guest booking", async () => {
            const response = await api.get(
              `/store/bookings/${guestBooking.id}`,
              storeHeadersWithCustomer1
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking.id).toEqual(guestBooking.id)
          })
        })

        describe("Customer booking access", () => {
          it("M6-T1: should allow authenticated customer to view their own booking", async () => {
            const response = await api.get(
              `/store/bookings/${customer1Booking.id}`,
              storeHeadersWithCustomer1
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking).toBeTruthy()
            expect(response.data.booking.id).toEqual(customer1Booking.id)
            expect(response.data.booking.customer_id).toEqual(customer1.id)
          })

          it("M6-T3: should deny unauthenticated request to view customer booking", async () => {
            const response = await api
              .get(`/store/bookings/${customer1Booking.id}`, storeHeaders)
              .catch((e) => e.response)

            expect(response.status).toEqual(403)
            expect(response.data.message).toContain("Not authorized")
          })

          it("M6-T3: should deny another customer from viewing different customer's booking", async () => {
            const response = await api
              .get(`/store/bookings/${customer1Booking.id}`, storeHeadersWithCustomer2)
              .catch((e) => e.response)

            expect(response.status).toEqual(403)
            expect(response.data.message).toContain("Not authorized")
          })
        })

        describe("Non-existent booking", () => {
          it("should return 404 for non-existent booking", async () => {
            const response = await api
              .get(`/store/bookings/book_nonexistent`, storeHeadersWithCustomer1)
              .catch((e) => e.response)

            expect(response.status).toEqual(404)
          })
        })
      })
    })
  },
})
