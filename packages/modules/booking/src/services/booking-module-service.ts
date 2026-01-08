import {
  AvailableSlotDTO,
  CheckSlotAvailabilityInput,
  Context,
  DAL,
  GetAvailableSlotsInput,
  InferEntityType,
  InternalModuleDeclaration,
  ModuleJoinerConfig,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  EmitEvents,
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import {
  BookingService,
  BookingStaff,
  BookingRecord,
  BookingAvailabilityRule,
  BookingSettings,
} from "@models"
import {
  ServiceDTO,
  StaffDTO,
  BookingDTO,
  AvailabilityRuleDTO,
  BookingSettingsDTO,
  UpdateBookingSettingsDTO,
} from "@types"
import { joinerConfig } from "../joiner-config"
import {
  findApplicableRule,
  generateSlotTimes,
  isInPast,
  isOnSlotBoundary,
  slotFitsInWorkingHours,
  doTimesOverlap,
  getTodayDateString,
  getDateString,
  ensureDate,
} from "../utils/availability"
import { BookingStatus, RuleType } from "../models"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  bookingServiceService: ModulesSdkTypes.IMedusaInternalService<any>
  bookingStaffService: ModulesSdkTypes.IMedusaInternalService<any>
  bookingRecordService: ModulesSdkTypes.IMedusaInternalService<any>
  bookingAvailabilityRuleService: ModulesSdkTypes.IMedusaInternalService<any>
  bookingSettingsService: ModulesSdkTypes.IMedusaInternalService<any>
}

export class BookingModuleService extends MedusaService<{
  BookingService: { dto: ServiceDTO }
  BookingStaff: { dto: StaffDTO }
  BookingRecord: { dto: BookingDTO }
  BookingAvailabilityRule: { dto: AvailabilityRuleDTO }
  BookingSettings: { dto: BookingSettingsDTO }
}>({
  BookingService,
  BookingStaff,
  BookingRecord,
  BookingAvailabilityRule,
  BookingSettings,
}) {
  protected baseRepository_: DAL.RepositoryService

  // Internal services injected through DI container
  protected readonly bookingServiceService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof BookingService>
  >
  protected bookingStaffService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof BookingStaff>
  >
  protected bookingRecordService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof BookingRecord>
  >
  protected bookingAvailabilityRuleService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof BookingAvailabilityRule>
  >
  protected bookingSettingsService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof BookingSettings>
  >

  constructor(
    {
      baseRepository,
      bookingServiceService,
      bookingStaffService,
      bookingRecordService,
      bookingAvailabilityRuleService,
      bookingSettingsService,
    }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    // @ts-ignore
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.bookingServiceService_ = bookingServiceService
    this.bookingStaffService_ = bookingStaffService
    this.bookingRecordService_ = bookingRecordService
    this.bookingAvailabilityRuleService_ = bookingAvailabilityRuleService
    this.bookingSettingsService_ = bookingSettingsService
  }

  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  // ==================== SETTINGS (Singleton) ====================

  @InjectManager()
  async getSettings(
    @MedusaContext() sharedContext: Context = {}
  ): Promise<BookingSettingsDTO> {
    const settings = await this.bookingSettingsService_.list(
      {},
      { take: 1 },
      sharedContext
    )

    if (!settings.length) {
      // Create default settings if none exist
      const [created] = await this.bookingSettingsService_.create(
        [
          {
            allow_guest_bookings: true,
            default_hold_duration_minutes: 10,
            cancellation_window_hours: 2,
            timezone: "America/New_York",
          },
        ],
        sharedContext
      )
      return await this.baseRepository_.serialize<BookingSettingsDTO>(created)
    }

    return await this.baseRepository_.serialize<BookingSettingsDTO>(settings[0])
  }

  @InjectManager()
  @EmitEvents()
  async updateSettings(
    data: UpdateBookingSettingsDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<BookingSettingsDTO> {
    return await this.updateSettings_(data, sharedContext)
  }

  @InjectTransactionManager()
  protected async updateSettings_(
    data: UpdateBookingSettingsDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<BookingSettingsDTO> {
    // Get or create settings
    const currentSettings = await this.getSettings(sharedContext)

    const [updated] = await this.bookingSettingsService_.update(
      [{ id: currentSettings.id, ...data }],
      sharedContext
    )

    return await this.baseRepository_.serialize<BookingSettingsDTO>(updated)
  }

  // ==================== SEED DEFAULT DATA ====================

  @InjectManager()
  async seedDefaultData(
    @MedusaContext() sharedContext: Context = {}
  ): Promise<{ staff: StaffDTO; settings: BookingSettingsDTO }> {
    return await this.seedDefaultData_(sharedContext)
  }

  @InjectTransactionManager()
  protected async seedDefaultData_(
    @MedusaContext() sharedContext: Context = {}
  ): Promise<{ staff: StaffDTO; settings: BookingSettingsDTO }> {
    // Check if default staff exists
    const existingStaff = await this.bookingStaffService_.list(
      {},
      { take: 1 },
      sharedContext
    )

    let staff: StaffDTO
    if (existingStaff.length === 0) {
      const [created] = await this.bookingStaffService_.create(
        [
          {
            name: "Default Barber",
            is_active: true,
          },
        ],
        sharedContext
      )
      staff = await this.baseRepository_.serialize<StaffDTO>(created)
    } else {
      staff = await this.baseRepository_.serialize<StaffDTO>(existingStaff[0])
    }

    // Get or create settings
    const settings = await this.getSettings(sharedContext)

    return { staff, settings }
  }

  // ==================== AVAILABILITY ====================

  @InjectManager()
  async getAvailableSlots(
    input: GetAvailableSlotsInput,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<AvailableSlotDTO[]> {
    const { date, service_id, staff_id } = input

    // Validate date is not in the past (comparing day only)
    // Use date strings to avoid timezone issues
    const todayStr = getTodayDateString()
    const targetDate = ensureDate(date)
    const targetStr = getDateString(targetDate)

    if (targetStr < todayStr) {
      return []
    }

    // Fetch the service to get duration and buffer time
    const service = await this.bookingServiceService_.retrieve(service_id, {}, sharedContext)
    if (!service) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Service with id: ${service_id} not found`
      )
    }
    if (!service.is_active) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Service with id: ${service_id} is not active`
      )
    }

    const totalDuration = service.duration_minutes + service.buffer_minutes
    const slotMinutes = 15

    // Fetch staff members
    let staffMembers: any[]
    if (staff_id) {
      const staff = await this.bookingStaffService_.retrieve(staff_id, {}, sharedContext)
      if (!staff || !staff.is_active) {
        return []
      }
      staffMembers = [staff]
    } else {
      staffMembers = await this.bookingStaffService_.list(
        { is_active: true },
        {},
        sharedContext
      )
    }

    if (staffMembers.length === 0) {
      return []
    }

    const availableSlots: AvailableSlotDTO[] = []

    for (const staff of staffMembers) {
      // Get availability rules for this staff
      const rules = await this.bookingAvailabilityRuleService_.list(
        { staff_id: staff.id },
        {},
        sharedContext
      )

      const serializedRules = await Promise.all(
        rules.map((r) => this.baseRepository_.serialize<AvailabilityRuleDTO>(r))
      )

      // Find the applicable rule for this date
      const applicableRule = findApplicableRule(serializedRules, date)

      // If no rule found or the rule is BLOCKED or not available, skip this staff
      if (!applicableRule) {
        continue
      }
      if (applicableRule.rule_type === RuleType.BLOCKED || !applicableRule.is_available) {
        continue
      }

      // Convert date to Date object using ensureDate (handles string parsing as local timezone)
      const targetDate = ensureDate(date)

      // Generate potential slot start times
      const potentialSlots = generateSlotTimes(
        applicableRule.start_time,
        applicableRule.end_time,
        targetDate,
        slotMinutes
      )

      // Get existing bookings for this staff on this date that could conflict
      // Use local timezone for day boundaries
      const dateForBoundaries = targetDate
      const dayStart = new Date(dateForBoundaries)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dateForBoundaries)
      dayEnd.setHours(23, 59, 59, 999)

      const existingBookings = await this.bookingRecordService_.list(
        {
          staff_id: staff.id,
          status: [BookingStatus.HELD, BookingStatus.CONFIRMED],
          start_at: { $gte: dayStart },
          end_at: { $lte: dayEnd },
        },
        {},
        sharedContext
      )

      // Filter slots that are available
      for (const slotStart of potentialSlots) {
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration)

        // Skip if slot is in the past
        if (isInPast(slotStart)) {
          continue
        }

        // Skip if slot doesn't fit within working hours
        if (!slotFitsInWorkingHours(slotStart, slotEnd, applicableRule)) {
          continue
        }

        // Check for conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) =>
          doTimesOverlap(
            slotStart,
            slotEnd,
            new Date(booking.start_at),
            new Date(booking.end_at)
          )
        )

        if (!hasConflict) {
          availableSlots.push({
            start_at: slotStart,
            end_at: slotEnd,
            staff_id: staff.id,
            staff_name: staff.name,
            service_id: service_id,
          })
        }
      }
    }

    // Sort by start time, then by staff name
    availableSlots.sort((a, b) => {
      const timeDiff = a.start_at.getTime() - b.start_at.getTime()
      if (timeDiff !== 0) return timeDiff
      return a.staff_name.localeCompare(b.staff_name)
    })

    return availableSlots
  }

  @InjectManager()
  async checkSlotAvailability(
    input: CheckSlotAvailabilityInput,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<boolean> {
    const { staff_id, start_at, end_at } = input

    // Convert to Date objects if they're strings (from workflow serialization)
    const startDate = start_at instanceof Date ? start_at : new Date(start_at)
    const endDate = end_at instanceof Date ? end_at : new Date(end_at)

    // Verify time is not in the past
    if (isInPast(startDate)) {
      return false
    }

    // Verify start_at is on a 15-minute boundary
    if (!isOnSlotBoundary(startDate)) {
      return false
    }

    // Verify staff exists and is active
    const staff = await this.bookingStaffService_.retrieve(staff_id, {}, sharedContext)
    if (!staff || !staff.is_active) {
      return false
    }

    // Get staff's availability rules
    const rules = await this.bookingAvailabilityRuleService_.list(
      { staff_id },
      {},
      sharedContext
    )

    const serializedRules = await Promise.all(
      rules.map((r) => this.baseRepository_.serialize<AvailabilityRuleDTO>(r))
    )

    // Find the applicable rule for this date
    const applicableRule = findApplicableRule(serializedRules, startDate)

    // If no rule found or the rule is BLOCKED or not available, slot is not available
    if (!applicableRule) {
      return false
    }
    if (applicableRule.rule_type === RuleType.BLOCKED || !applicableRule.is_available) {
      return false
    }

    // Verify slot is within working hours
    if (!slotFitsInWorkingHours(startDate, endDate, applicableRule)) {
      return false
    }

    // Check for conflicts with existing bookings
    const existingBookings = await this.bookingRecordService_.list(
      {
        staff_id,
        status: [BookingStatus.HELD, BookingStatus.CONFIRMED],
      },
      {},
      sharedContext
    )

    const hasConflict = existingBookings.some((booking) =>
      doTimesOverlap(
        startDate,
        endDate,
        new Date(booking.start_at),
        new Date(booking.end_at)
      )
    )

    return !hasConflict
  }
}
