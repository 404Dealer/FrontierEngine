import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../../helpers/create-admin-user"

jest.setTimeout(100000)

const env = {}

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Staff Availability Admin API", () => {
      let appContainer
      let bookingService
      let staff

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        bookingService = appContainer.resolve(Modules.BOOKING)

        // Create a test staff member
        staff = await bookingService.createBookingStaffs({
          name: "Test Staff",
          email: "staff@test.com",
          is_active: true,
        })
      })

      describe("GET /admin/bookings/staff/:id with availability_rules", () => {
        it("returns empty availability_rules array when staff has no rules", async () => {
          const response = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.staff).toBeTruthy()
          expect(response.data.staff.id).toEqual(staff.id)
          expect(response.data.staff.availability_rules).toBeDefined()
          expect(Array.isArray(response.data.staff.availability_rules)).toBe(
            true
          )
          expect(response.data.staff.availability_rules).toHaveLength(0)
        })

        it("returns availability_rules when staff has rules", async () => {
          // Create a rule directly via service
          await bookingService.createBookingAvailabilityRules({
            staff_id: staff.id,
            rule_type: "recurring",
            day_of_week: 1,
            start_time: "09:00",
            end_time: "17:00",
            is_available: true,
          })

          const response = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.staff.availability_rules).toHaveLength(1)
          expect(response.data.staff.availability_rules[0].day_of_week).toEqual(
            1
          )
          expect(response.data.staff.availability_rules[0].start_time).toEqual(
            "09:00"
          )
          expect(response.data.staff.availability_rules[0].end_time).toEqual(
            "17:00"
          )
        })
      })

      describe("POST /admin/bookings/staff/:id/availability", () => {
        it("creates recurring availability rule", async () => {
          const response = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 1,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.rule).toBeTruthy()
          expect(response.data.rule.id).toMatch(/^bkavl_/)
          expect(response.data.rule.staff_id).toEqual(staff.id)
          expect(response.data.rule.rule_type).toEqual("recurring")
          expect(response.data.rule.day_of_week).toEqual(1)
          expect(response.data.rule.start_time).toEqual("09:00")
          expect(response.data.rule.end_time).toEqual("17:00")
          expect(response.data.rule.is_available).toEqual(true)
        })

        it("creates exception availability rule with specific date", async () => {
          const specificDate = "2025-06-15"

          const response = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "exception",
              specific_date: specificDate,
              start_time: "10:00",
              end_time: "14:00",
              is_available: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.rule.rule_type).toEqual("exception")
          expect(response.data.rule.specific_date).toContain("2025-06-15")
          expect(response.data.rule.start_time).toEqual("10:00")
          expect(response.data.rule.end_time).toEqual("14:00")
        })

        it("creates blocked date rule", async () => {
          const blockedDate = "2025-07-04"

          const response = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "blocked",
              specific_date: blockedDate,
              start_time: "00:00",
              end_time: "23:59",
              is_available: false,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.rule.rule_type).toEqual("blocked")
          expect(response.data.rule.is_available).toEqual(false)
        })

        it("returns 404 for non-existent staff", async () => {
          const response = await api
            .post(
              `/admin/bookings/staff/bstaff_nonexistent/availability`,
              {
                rule_type: "recurring",
                day_of_week: 1,
                start_time: "09:00",
                end_time: "17:00",
                is_available: true,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("DELETE /admin/bookings/staff/:id/availability/:ruleId", () => {
        it("deletes existing rule", async () => {
          // First create a rule
          const createResponse = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 2,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          const ruleId = createResponse.data.rule.id

          // Delete the rule
          const deleteResponse = await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${ruleId}`,
            adminHeaders
          )

          expect(deleteResponse.status).toEqual(200)
          expect(deleteResponse.data.id).toEqual(ruleId)
          expect(deleteResponse.data.deleted).toEqual(true)
        })

        it("returns 200 for non-existent rule (soft delete pattern)", async () => {
          // Note: Medusa's soft delete pattern doesn't throw for non-existent IDs
          // This is consistent with other module delete behaviors
          const response = await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/bkavl_nonexistent`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual("bkavl_nonexistent")
          expect(response.data.deleted).toEqual(true)
        })
      })

      describe("Data consistency (bug regression tests)", () => {
        it("reflects created rule in subsequent GET request", async () => {
          // Initial state - no rules
          const initialResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )
          expect(initialResponse.data.staff.availability_rules).toHaveLength(0)

          // Create a rule via API
          await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 0, // Sunday
              start_time: "10:00",
              end_time: "16:00",
              is_available: true,
            },
            adminHeaders
          )

          // Fetch again - rule should appear
          const afterCreateResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(afterCreateResponse.data.staff.availability_rules).toHaveLength(
            1
          )
          expect(
            afterCreateResponse.data.staff.availability_rules[0].day_of_week
          ).toEqual(0)
        })

        it("reflects deleted rule removal in subsequent GET request", async () => {
          // Create a rule
          const createResponse = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 3, // Wednesday
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          const ruleId = createResponse.data.rule.id

          // Verify rule exists
          const beforeDeleteResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )
          expect(
            beforeDeleteResponse.data.staff.availability_rules
          ).toHaveLength(1)

          // Delete the rule
          await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${ruleId}`,
            adminHeaders
          )

          // Fetch again - rule should be gone
          const afterDeleteResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(afterDeleteResponse.data.staff.availability_rules).toHaveLength(
            0
          )
        })

        it("handles multiple rules correctly (toggle on/off scenario)", async () => {
          // This tests the actual bug scenario:
          // 1. Enable Monday (create rule)
          // 2. Enable Tuesday (create rule)
          // 3. Disable Monday (delete rule)
          // 4. Verify only Tuesday remains

          // Enable Monday (day_of_week = 1)
          const mondayResponse = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 1,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )
          const mondayRuleId = mondayResponse.data.rule.id

          // Enable Tuesday (day_of_week = 2)
          await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 2,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          // Verify both rules exist
          const midStateResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )
          expect(midStateResponse.data.staff.availability_rules).toHaveLength(2)

          // Disable Monday (delete rule)
          await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${mondayRuleId}`,
            adminHeaders
          )

          // Verify only Tuesday remains
          const finalResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(finalResponse.data.staff.availability_rules).toHaveLength(1)
          expect(
            finalResponse.data.staff.availability_rules[0].day_of_week
          ).toEqual(2) // Tuesday
        })

        it("handles rapid create/delete operations correctly", async () => {
          // Create multiple rules quickly
          const rule1 = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 1,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          const rule2 = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 2,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          const rule3 = await api.post(
            `/admin/bookings/staff/${staff.id}/availability`,
            {
              rule_type: "recurring",
              day_of_week: 3,
              start_time: "09:00",
              end_time: "17:00",
              is_available: true,
            },
            adminHeaders
          )

          // Delete all rules quickly
          await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${rule1.data.rule.id}`,
            adminHeaders
          )
          await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${rule2.data.rule.id}`,
            adminHeaders
          )
          await api.delete(
            `/admin/bookings/staff/${staff.id}/availability/${rule3.data.rule.id}`,
            adminHeaders
          )

          // Verify all rules are gone
          const finalResponse = await api.get(
            `/admin/bookings/staff/${staff.id}?fields=+availability_rules`,
            adminHeaders
          )

          expect(finalResponse.data.staff.availability_rules).toHaveLength(0)
        })
      })

      describe("GET /admin/bookings/staff/:id/availability (list endpoint)", () => {
        it("lists all availability rules for a staff member", async () => {
          // Create multiple rules
          await bookingService.createBookingAvailabilityRules({
            staff_id: staff.id,
            rule_type: "recurring",
            day_of_week: 1,
            start_time: "09:00",
            end_time: "17:00",
            is_available: true,
          })

          await bookingService.createBookingAvailabilityRules({
            staff_id: staff.id,
            rule_type: "recurring",
            day_of_week: 2,
            start_time: "09:00",
            end_time: "17:00",
            is_available: true,
          })

          const response = await api.get(
            `/admin/bookings/staff/${staff.id}/availability`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.rules).toHaveLength(2)
          expect(response.data.count).toEqual(2)
        })
      })
    })
  },
})
