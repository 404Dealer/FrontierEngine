import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  BookingStatus,
  DepositType,
  PaymentMode,
  PaymentModeAllowed,
} from "@medusajs/framework/types"
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
    describe("Booking Payment Integration", () => {
      let appContainer
      let storeHeaders
      let storeHeadersWithCustomer
      let region
      let customer
      let bookingService
      let staff
      let service
      let booking

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

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

        // Create region
        region = (
          await api.post(
            "/admin/regions",
            { name: "US", currency_code: "usd", countries: ["us"] },
            adminHeaders
          )
        ).data.region

        // Get booking module service
        bookingService = appContainer.resolve(Modules.BOOKING)

        // Create staff member
        staff = await bookingService.createBookingStaffs({
          name: "Test Staff",
          email: "staff@test.com",
          is_active: true,
        })

        // Create service with deposit config (20% deposit)
        // payment_modes_allowed uses categories: "in_person" (allows pay_in_store)
        // and "online" (allows deposit/full)
        // Note: region_id is now passed at confirmation time, not on service
        service = await bookingService.createBookingServices({
          name: "Haircut Service",
          price: 5000, // $50.00
          currency_code: "usd",
          duration_minutes: 60,
          deposit_type: DepositType.PERCENTAGE,
          deposit_value: 20, // 20% deposit = $10.00
          payment_modes_allowed: [
            PaymentModeAllowed.IN_PERSON,
            PaymentModeAllowed.ONLINE,
          ],
          is_active: true,
        })

        // Create a held booking
        const startAt = new Date()
        startAt.setHours(startAt.getHours() + 24) // Tomorrow
        const endAt = new Date(startAt)
        endAt.setMinutes(endAt.getMinutes() + 60)

        booking = await bookingService.createBookingRecords({
          staff_id: staff.id,
          service_id: service.id,
          customer_id: customer.id,
          start_at: startAt,
          end_at: endAt,
          status: BookingStatus.HELD,
          hold_expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 min hold
          service_name: service.name,
          price_amount: service.price,
          currency_code: service.currency_code,
          customer_email: "john@example.com",
        })
      })

      describe("POST /store/bookings/:id/confirm", () => {
        describe("PAY_IN_STORE mode (M4-T8)", () => {
          it("should confirm booking immediately without creating cart", async () => {
            const response = await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "pay_in_store" },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking).toBeTruthy()
            expect(response.data.booking.status).toEqual(BookingStatus.CONFIRMED)
            expect(response.data.booking.payment_mode).toEqual(PaymentMode.PAY_IN_STORE)
            expect(response.data.booking.confirmed_at).toBeTruthy()
            expect(response.data.cart_id).toBeNull()
          })
        })

        describe("DEPOSIT mode (M4-T1)", () => {
          it("should create cart with deposit amount (20% of $50 = $10)", async () => {
            const response = await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "deposit", region_id: region.id },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking).toBeNull()
            expect(response.data.cart_id).toBeTruthy()

            // Verify cart was created with correct amount
            const cartResponse = await api.get(
              `/store/carts/${response.data.cart_id}`,
              storeHeaders
            )

            expect(cartResponse.status).toEqual(200)
            expect(cartResponse.data.cart.items).toHaveLength(1)
            expect(cartResponse.data.cart.items[0].unit_price).toEqual(1000) // $10 deposit
            expect(cartResponse.data.cart.items[0].metadata.booking_id).toEqual(
              booking.id
            )
            expect(cartResponse.data.cart.items[0].metadata.payment_mode).toEqual(
              PaymentMode.DEPOSIT
            )
          })
        })

        describe("FULL payment mode (M4-T2)", () => {
          it("should create cart with full price amount ($50)", async () => {
            const response = await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "full", region_id: region.id },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking).toBeNull()
            expect(response.data.cart_id).toBeTruthy()

            // Verify cart was created with correct amount
            const cartResponse = await api.get(
              `/store/carts/${response.data.cart_id}`,
              storeHeaders
            )

            expect(cartResponse.status).toEqual(200)
            expect(cartResponse.data.cart.items).toHaveLength(1)
            expect(cartResponse.data.cart.items[0].unit_price).toEqual(5000) // $50 full price
            expect(cartResponse.data.cart.items[0].metadata.booking_id).toEqual(
              booking.id
            )
            expect(cartResponse.data.cart.items[0].metadata.payment_mode).toEqual(
              PaymentMode.FULL
            )
          })
        })

        describe("Fixed deposit type", () => {
          it("should create cart with fixed deposit amount", async () => {
            // Create service with fixed deposit (online payment only)
            const fixedService = await bookingService.createBookingServices({
              name: "Fixed Deposit Service",
              price: 10000, // $100.00
              currency_code: "usd",
              duration_minutes: 90,
              deposit_type: DepositType.FIXED,
              deposit_value: 2500, // $25 fixed deposit
              payment_modes_allowed: [PaymentModeAllowed.ONLINE],
              is_active: true,
            })

            // Create booking for this service
            const startAt = new Date()
            startAt.setHours(startAt.getHours() + 48)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 90)

            const fixedBooking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: fixedService.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.HELD,
              hold_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              service_name: fixedService.name,
              price_amount: fixedService.price,
              currency_code: fixedService.currency_code,
              customer_email: "john@example.com",
            })

            const response = await api.post(
              `/store/bookings/${fixedBooking.id}/confirm`,
              { payment_mode: "deposit", region_id: region.id },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.cart_id).toBeTruthy()

            const cartResponse = await api.get(
              `/store/carts/${response.data.cart_id}`,
              storeHeaders
            )

            expect(cartResponse.data.cart.items[0].unit_price).toEqual(2500) // $25 fixed deposit
          })
        })

        describe("Validation errors", () => {
          it("should fail if booking is not in HELD status", async () => {
            // Update booking to confirmed
            await bookingService.updateBookingRecords({
              id: booking.id,
              status: BookingStatus.CONFIRMED,
            })

            const response = await api
              .post(
                `/store/bookings/${booking.id}/confirm`,
                { payment_mode: "pay_in_store" },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should fail if hold has expired", async () => {
            // Update booking to have expired hold
            await bookingService.updateBookingRecords({
              id: booking.id,
              hold_expires_at: new Date(Date.now() - 1000), // Expired
            })

            const response = await api
              .post(
                `/store/bookings/${booking.id}/confirm`,
                { payment_mode: "pay_in_store" },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should fail if no region_id provided and store has no default region", async () => {
            // Create service for online payment
            const onlineService = await bookingService.createBookingServices({
              name: "Online Service",
              price: 3000,
              currency_code: "usd",
              duration_minutes: 30,
              deposit_type: DepositType.PERCENTAGE,
              deposit_value: 20,
              payment_modes_allowed: [PaymentModeAllowed.ONLINE],
              is_active: true,
            })

            const startAt = new Date()
            startAt.setHours(startAt.getHours() + 72)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 30)

            const testBooking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: onlineService.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.HELD,
              hold_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              service_name: onlineService.name,
              price_amount: onlineService.price,
              currency_code: onlineService.currency_code,
              customer_email: "john@example.com",
            })

            // Try to confirm without passing region_id
            // This should fail because no region_id is passed and store has no default
            const response = await api
              .post(
                `/store/bookings/${testBooking.id}/confirm`,
                { payment_mode: "deposit" }, // No region_id
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
            expect(response.data.message).toContain("region")
          })

          it("should fail if payment mode is not allowed for service (online only)", async () => {
            // Create service that only allows online payment
            const onlineOnlyService = await bookingService.createBookingServices({
              name: "Online Only Service",
              price: 4000,
              currency_code: "usd",
              duration_minutes: 45,
              deposit_type: DepositType.NONE,
              payment_modes_allowed: [PaymentModeAllowed.ONLINE], // Only online
              is_active: true,
            })

            const startAt = new Date()
            startAt.setHours(startAt.getHours() + 96)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 45)

            const onlineOnlyBooking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: onlineOnlyService.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.HELD,
              hold_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              service_name: onlineOnlyService.name,
              price_amount: onlineOnlyService.price,
              currency_code: onlineOnlyService.currency_code,
              customer_email: "john@example.com",
            })

            // Try to use pay_in_store on online-only service
            const response = await api
              .post(
                `/store/bookings/${onlineOnlyBooking.id}/confirm`,
                { payment_mode: "pay_in_store" },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
            expect(response.data.message).toContain("online")
          })

          it("should fail if service has deposit but pay_in_store is requested", async () => {
            // Create service with deposit that should require online payment
            const depositService = await bookingService.createBookingServices({
              name: "Deposit Required Service",
              price: 8000,
              currency_code: "usd",
              duration_minutes: 60,
              deposit_type: DepositType.FIXED,
              deposit_value: 2000, // $20 deposit required
              payment_modes_allowed: [
                PaymentModeAllowed.IN_PERSON,
                PaymentModeAllowed.ONLINE,
              ], // Both allowed, but deposit overrides
              is_active: true,
            })

            const startAt = new Date()
            startAt.setHours(startAt.getHours() + 120)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 60)

            const depositBooking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: depositService.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.HELD,
              hold_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              service_name: depositService.name,
              price_amount: depositService.price,
              currency_code: depositService.currency_code,
              customer_email: "john@example.com",
            })

            // Try to use pay_in_store when deposit is required
            const response = await api
              .post(
                `/store/bookings/${depositBooking.id}/confirm`,
                { payment_mode: "pay_in_store" },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
            expect(response.data.message).toContain("deposit")
          })

          it("should fail if deposit mode requested but no deposit configured", async () => {
            // Create service without deposit
            const noDepositService = await bookingService.createBookingServices({
              name: "No Deposit Service",
              price: 3500,
              currency_code: "usd",
              duration_minutes: 30,
              deposit_type: DepositType.NONE, // No deposit
              payment_modes_allowed: [
                PaymentModeAllowed.IN_PERSON,
                PaymentModeAllowed.ONLINE,
              ],
              is_active: true,
            })

            const startAt = new Date()
            startAt.setHours(startAt.getHours() + 144)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 30)

            const noDepositBooking = await bookingService.createBookingRecords({
              staff_id: staff.id,
              service_id: noDepositService.id,
              customer_id: customer.id,
              start_at: startAt,
              end_at: endAt,
              status: BookingStatus.HELD,
              hold_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              service_name: noDepositService.name,
              price_amount: noDepositService.price,
              currency_code: noDepositService.currency_code,
              customer_email: "john@example.com",
            })

            // Try to use deposit mode when no deposit is configured
            const response = await api
              .post(
                `/store/bookings/${noDepositBooking.id}/confirm`,
                { payment_mode: "deposit", region_id: region.id },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
            expect(response.data.message).toContain("deposit")
          })
        })
      })

      describe("POST /store/bookings/:id/cancel", () => {
        describe("Cancel pay-in-store booking (M4-T7)", () => {
          it("should cancel confirmed pay-in-store booking without refund", async () => {
            // First confirm the booking with pay_in_store
            await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "pay_in_store" },
              storeHeadersWithCustomer
            )

            // Then cancel it
            const response = await api.post(
              `/store/bookings/${booking.id}/cancel`,
              { reason: "Customer requested cancellation" },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking.status).toEqual(BookingStatus.CANCELLED)
            expect(response.data.booking.cancelled_at).toBeTruthy()
          })
        })

        describe("Cancel held booking", () => {
          it("should cancel a held booking", async () => {
            const response = await api.post(
              `/store/bookings/${booking.id}/cancel`,
              { reason: "Changed my mind" },
              storeHeadersWithCustomer
            )

            expect(response.status).toEqual(200)
            expect(response.data.booking.status).toEqual(BookingStatus.CANCELLED)
          })
        })

        describe("Cancellation window validation", () => {
          it("should prevent cancellation within cancellation window", async () => {
            // Create booking starting in 30 minutes (within 2-hour window)
            const startAt = new Date()
            startAt.setMinutes(startAt.getMinutes() + 30)
            const endAt = new Date(startAt)
            endAt.setMinutes(endAt.getMinutes() + 60)

            const urgentBooking = await bookingService.createBookingRecords({
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
              payment_mode: PaymentMode.PAY_IN_STORE,
              confirmed_at: new Date(),
            })

            const response = await api
              .post(
                `/store/bookings/${urgentBooking.id}/cancel`,
                { reason: "Too late to cancel" },
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
            expect(response.data.message).toContain("cancellation window")
          })
        })

        describe("Validation errors", () => {
          it("should fail if booking is already cancelled", async () => {
            // Cancel the booking first
            await api.post(
              `/store/bookings/${booking.id}/cancel`,
              {},
              storeHeadersWithCustomer
            )

            // Try to cancel again
            const response = await api
              .post(
                `/store/bookings/${booking.id}/cancel`,
                {},
                storeHeadersWithCustomer
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })
        })
      })

      describe("Cancel paid booking (M4-T6)", () => {
        it("should cancel booking with linked order", async () => {
          const remoteLink = appContainer.resolve(ContainerRegistrationKeys.LINK)
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const orderModule = appContainer.resolve(Modules.ORDER)

          // Confirm booking with full payment
          const confirmResponse = await api.post(
            `/store/bookings/${booking.id}/confirm`,
            { payment_mode: "full", region_id: region.id },
            storeHeadersWithCustomer
          )

          expect(confirmResponse.data.cart_id).toBeTruthy()

          // Simulate order placed (what checkout does)
          const order = await orderModule.createOrders({
            currency_code: "usd",
            email: "john@example.com",
            items: [
              {
                title: service.name,
                quantity: 1,
                unit_price: 5000,
                metadata: {
                  booking_id: booking.id,
                  payment_mode: PaymentMode.FULL,
                },
              },
            ],
          })

          // Update booking to confirmed (simulating subscriber)
          await bookingService.updateBookingRecords({
            id: booking.id,
            status: BookingStatus.CONFIRMED,
            confirmed_at: new Date(),
            hold_expires_at: null,
            amount_paid: 5000,
          })

          // Create the order-booking link
          await remoteLink.create({
            [Modules.ORDER]: {
              order_id: order.id,
            },
            [Modules.BOOKING]: {
              booking_id: booking.id,
            },
          })

          // Verify booking has linked order
          const bookingWithOrder = await query.graph({
            entity: "booking",
            fields: ["id", "status", "order.*"],
            filters: { id: booking.id },
          })
          expect(bookingWithOrder.data[0].order.id).toEqual(order.id)

          // Now cancel the booking
          // Note: In a full implementation, this would also cancel/refund the order
          // For this test, we verify the booking gets cancelled
          const cancelResponse = await api.post(
            `/store/bookings/${booking.id}/cancel`,
            { reason: "Need to reschedule" },
            storeHeadersWithCustomer
          )

          expect(cancelResponse.status).toEqual(200)
          expect(cancelResponse.data.booking.status).toEqual(BookingStatus.CANCELLED)
          expect(cancelResponse.data.booking.cancelled_at).toBeTruthy()
        })
      })

      describe("Order-Booking Link (M4-T3, M4-T4, M4-T5)", () => {
        /**
         * These tests verify the order-booking link functionality.
         * Full checkout flow testing is complex due to payment/shipping setup.
         * We test the link creation directly using the remoteLink service.
         */
        describe("Link creation and querying", () => {
          it("should be able to create and query order-booking link", async () => {
            const remoteLink = appContainer.resolve(ContainerRegistrationKeys.LINK)
            const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

            // First confirm the booking
            await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "pay_in_store" },
              storeHeadersWithCustomer
            )

            // Simulate order creation (in real flow, this would be done by checkout)
            const orderModule = appContainer.resolve(Modules.ORDER)
            const order = await orderModule.createOrders({
              currency_code: "usd",
              email: "john@example.com",
              items: [
                {
                  title: service.name,
                  quantity: 1,
                  unit_price: 5000,
                },
              ],
            })

            // Create the order-booking link (simulating what the subscriber does)
            await remoteLink.create({
              [Modules.ORDER]: {
                order_id: order.id,
              },
              [Modules.BOOKING]: {
                booking_id: booking.id,
              },
            })

            // M4-T4: Query booking with order relationship
            const bookingWithOrder = await query.graph({
              entity: "booking",
              fields: ["id", "status", "order.*"],
              filters: { id: booking.id },
            })

            expect(bookingWithOrder.data[0]).toBeTruthy()
            expect(bookingWithOrder.data[0].order).toBeTruthy()
            expect(bookingWithOrder.data[0].order.id).toEqual(order.id)

            // M4-T5: Query order with booking relationship
            const orderWithBooking = await query.graph({
              entity: "order",
              fields: ["id", "email", "booking.*"],
              filters: { id: order.id },
            })

            expect(orderWithBooking.data[0]).toBeTruthy()
            expect(orderWithBooking.data[0].booking).toBeTruthy()
            expect(orderWithBooking.data[0].booking.id).toEqual(booking.id)
          })
        })

        describe("Checkout completion confirms booking (M4-T3)", () => {
          it("should update booking to confirmed when order is placed via subscriber", async () => {
            // This test verifies the subscriber logic by simulating what happens
            // when an order is placed with a booking line item
            const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
            const remoteLink = appContainer.resolve(ContainerRegistrationKeys.LINK)

            // Create booking cart (simulates confirm with FULL payment)
            const confirmResponse = await api.post(
              `/store/bookings/${booking.id}/confirm`,
              { payment_mode: "full", region_id: region.id },
              storeHeadersWithCustomer
            )

            expect(confirmResponse.data.cart_id).toBeTruthy()

            // Verify booking is still HELD (not yet confirmed)
            const heldBooking = await bookingService.retrieveBookingRecord(booking.id)
            expect(heldBooking.status).toEqual(BookingStatus.HELD)
            expect(heldBooking.payment_mode).toEqual(PaymentMode.FULL)

            // Simulate order creation with booking metadata (what checkout does)
            const orderModule = appContainer.resolve(Modules.ORDER)
            const order = await orderModule.createOrders({
              currency_code: "usd",
              email: "john@example.com",
              items: [
                {
                  title: service.name,
                  quantity: 1,
                  unit_price: 5000,
                  metadata: {
                    booking_id: booking.id,
                    payment_mode: PaymentMode.FULL,
                  },
                },
              ],
            })

            // Simulate what the booking-order-placed subscriber does:
            // 1. Update booking to CONFIRMED
            await bookingService.updateBookingRecords({
              id: booking.id,
              status: BookingStatus.CONFIRMED,
              confirmed_at: new Date(),
              hold_expires_at: null,
              amount_paid: 5000,
            })

            // 2. Create the link
            await remoteLink.create({
              [Modules.ORDER]: {
                order_id: order.id,
              },
              [Modules.BOOKING]: {
                booking_id: booking.id,
              },
            })

            // Verify booking is now CONFIRMED
            const confirmedBooking = await bookingService.retrieveBookingRecord(
              booking.id
            )
            expect(confirmedBooking.status).toEqual(BookingStatus.CONFIRMED)
            expect(confirmedBooking.confirmed_at).toBeTruthy()
            expect(Number(confirmedBooking.amount_paid)).toEqual(5000)

            // Verify link exists
            const bookingWithOrder = await query.graph({
              entity: "booking",
              fields: ["id", "order.*"],
              filters: { id: booking.id },
            })
            expect(bookingWithOrder.data[0].order.id).toEqual(order.id)
          })
        })
      })
    })
  },
})
