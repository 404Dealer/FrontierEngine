import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { BookingStatus } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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
    describe("Customer-Booking Link Integration", () => {
      let appContainer
      let storeHeaders
      let storeHeadersWithCustomer
      let customer
      let bookingService
      let staff
      let service
      let remoteLink
      let query

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        // Create authenticated customer
        const result = await createAuthenticatedCustomer(api, storeHeaders, {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        })
        customer = result.customer
        storeHeadersWithCustomer = {
          headers: {
            ...storeHeaders.headers,
            authorization: `Bearer ${result.jwt}`,
          },
        }

        // Get services
        bookingService = appContainer.resolve(Modules.BOOKING)
        remoteLink = appContainer.resolve(ContainerRegistrationKeys.LINK)
        query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

        // Create staff member with availability
        staff = await bookingService.createBookingStaffs({
          name: "Test Staff",
          email: "staff@test.com",
          is_active: true,
        })

        // Create availability rule for staff (9 AM - 5 PM on all days)
        const today = new Date()
        for (let i = 0; i < 7; i++) {
          await bookingService.createAvailabilityRules({
            staff_id: staff.id,
            rule_type: "recurring",
            day_of_week: i,
            start_time: "09:00",
            end_time: "17:00",
            is_available: true,
          })
        }

        // Create service
        service = await bookingService.createBookingServices({
          name: "Test Service",
          price: 5000,
          currency_code: "usd",
          duration_minutes: 30,
          buffer_minutes: 10,
          is_active: true,
        })
      })

      describe("CustomerBooking Link via Workflow (M6-T4)", () => {
        it("should create customer-booking link when holding slot with customer_id", async () => {
          // Get tomorrow at 10 AM
          const startAt = new Date()
          startAt.setDate(startAt.getDate() + 1)
          startAt.setHours(10, 0, 0, 0)

          // Hold a slot as authenticated customer
          const response = await api.post(
            `/store/bookings`,
            {
              staff_id: staff.id,
              service_id: service.id,
              start_at: startAt.toISOString(),
              customer_email: "john@example.com",
            },
            storeHeadersWithCustomer
          )

          expect(response.status).toEqual(200)
          expect(response.data.booking).toBeTruthy()

          const bookingId = response.data.booking.id

          // Verify booking was created with customer_id
          const booking = await bookingService.retrieveBookingRecord(bookingId)
          expect(booking.customer_id).toEqual(customer.id)

          // Verify customer-booking link was created
          const customerWithBookings = await query.graph({
            entity: "customer",
            fields: ["id", "email", "bookings.*"],
            filters: { id: customer.id },
          })

          expect(customerWithBookings.data[0]).toBeTruthy()
          expect(customerWithBookings.data[0].bookings).toBeTruthy()
          expect(customerWithBookings.data[0].bookings.length).toBeGreaterThanOrEqual(1)

          const linkedBooking = customerWithBookings.data[0].bookings.find(
            (b: any) => b.id === bookingId
          )
          expect(linkedBooking).toBeTruthy()
        })

        it("should NOT create customer-booking link for guest bookings", async () => {
          // Get tomorrow at 2 PM
          const startAt = new Date()
          startAt.setDate(startAt.getDate() + 1)
          startAt.setHours(14, 0, 0, 0)

          // Hold a slot as guest (unauthenticated)
          const response = await api.post(
            `/store/bookings`,
            {
              staff_id: staff.id,
              service_id: service.id,
              start_at: startAt.toISOString(),
              customer_email: "guest@example.com",
              customer_name: "Guest User",
            },
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.booking).toBeTruthy()
          expect(response.data.booking.customer_id).toBeNull()

          // Verify no link was created by checking query doesn't fail
          // and booking can still be retrieved
          const booking = await bookingService.retrieveBookingRecord(
            response.data.booking.id
          )
          expect(booking.customer_id).toBeNull()
        })
      })

      describe("Query Graph Integration (M6-T5, M6-T6)", () => {
        let booking

        beforeEach(async () => {
          // Create a booking with customer_id
          const startAt = new Date()
          startAt.setDate(startAt.getDate() + 2)
          startAt.setHours(11, 0, 0, 0)
          const endAt = new Date(startAt)
          endAt.setMinutes(endAt.getMinutes() + 30)

          booking = await bookingService.createBookingRecords({
            staff_id: staff.id,
            service_id: service.id,
            customer_id: customer.id,
            start_at: startAt,
            end_at: endAt,
            status: BookingStatus.CONFIRMED,
            service_name: service.name,
            price_amount: service.price,
            currency_code: service.currency_code,
            customer_email: "john@example.com",
          })

          // Create the link manually (simulating what workflow does)
          await remoteLink.create({
            [Modules.CUSTOMER]: {
              customer_id: customer.id,
            },
            [Modules.BOOKING]: {
              booking_id: booking.id,
            },
          })
        })

        describe("M6-T5: Query customer.bookings", () => {
          it("should be able to query customer with their bookings", async () => {
            const customerWithBookings = await query.graph({
              entity: "customer",
              fields: [
                "id",
                "email",
                "first_name",
                "last_name",
                "bookings.id",
                "bookings.status",
                "bookings.start_at",
                "bookings.service_name",
              ],
              filters: { id: customer.id },
            })

            expect(customerWithBookings.data[0]).toBeTruthy()
            expect(customerWithBookings.data[0].id).toEqual(customer.id)
            expect(customerWithBookings.data[0].email).toEqual("john@example.com")
            expect(customerWithBookings.data[0].bookings).toBeTruthy()
            expect(Array.isArray(customerWithBookings.data[0].bookings)).toBe(true)

            const linkedBooking = customerWithBookings.data[0].bookings.find(
              (b: any) => b.id === booking.id
            )
            expect(linkedBooking).toBeTruthy()
            expect(linkedBooking.status).toEqual(BookingStatus.CONFIRMED)
            expect(linkedBooking.service_name).toEqual(service.name)
          })
        })

        describe("M6-T6: Query booking.customer", () => {
          it("should be able to query booking with customer details", async () => {
            const bookingWithCustomer = await query.graph({
              entity: "booking",
              fields: [
                "id",
                "status",
                "service_name",
                "customer.id",
                "customer.email",
                "customer.first_name",
                "customer.last_name",
              ],
              filters: { id: booking.id },
            })

            expect(bookingWithCustomer.data[0]).toBeTruthy()
            expect(bookingWithCustomer.data[0].id).toEqual(booking.id)
            expect(bookingWithCustomer.data[0].customer).toBeTruthy()
            expect(bookingWithCustomer.data[0].customer.id).toEqual(customer.id)
            expect(bookingWithCustomer.data[0].customer.email).toEqual("john@example.com")
            expect(bookingWithCustomer.data[0].customer.first_name).toEqual("John")
          })
        })
      })

      describe("Multiple bookings per customer", () => {
        it("should correctly link multiple bookings to the same customer", async () => {
          // Create multiple bookings for the same customer
          const bookings = []
          for (let i = 0; i < 3; i++) {
            const startAt = new Date()
            startAt.setDate(startAt.getDate() + 3 + i)
            startAt.setHours(10, 0, 0, 0)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 30)

            const booking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: service.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.CONFIRMED,
              service_name: `Service ${i + 1}`,
              price_amount: service.price,
              currency_code: service.currency_code,
              customer_email: "john@example.com",
            })

            // Create the link
            await remoteLink.create({
              [Modules.CUSTOMER]: {
                customer_id: customer.id,
              },
              [Modules.BOOKING]: {
                booking_id: booking.id,
              },
            })

            bookings.push(booking)
          }

          // Query customer with all bookings
          const customerWithBookings = await query.graph({
            entity: "customer",
            fields: ["id", "bookings.*"],
            filters: { id: customer.id },
          })

          expect(customerWithBookings.data[0].bookings.length).toBeGreaterThanOrEqual(3)

          // Verify all created bookings are linked
          for (const booking of bookings) {
            const linked = customerWithBookings.data[0].bookings.find(
              (b: any) => b.id === booking.id
            )
            expect(linked).toBeTruthy()
          }
        })
      })
    })
  },
})
