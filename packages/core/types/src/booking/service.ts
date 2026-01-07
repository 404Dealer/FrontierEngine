import type { FindConfig } from "../common"
import type { RestoreReturn, SoftDeleteReturn } from "../dal"
import type { IModuleService } from "../modules-sdk"
import type { Context } from "../shared-context"
import type {
  AvailabilityRuleDTO,
  AvailableSlotDTO,
  BookingDTO,
  BookingSettingsDTO,
  CheckSlotAvailabilityInput,
  FilterableAvailabilityRuleProps,
  FilterableBookingProps,
  FilterableServiceProps,
  FilterableStaffProps,
  GetAvailableSlotsInput,
  ServiceDTO,
  StaffDTO,
} from "./common"
import type {
  CreateAvailabilityRuleDTO,
  CreateBookingDTO,
  CreateServiceDTO,
  CreateStaffDTO,
  UpdateAvailabilityRuleDTO,
  UpdateBookingDTO,
  UpdateBookingSettingsDTO,
  UpdateServiceDTO,
  UpdateStaffDTO,
} from "./mutations"

/**
 * The main service interface for the Booking Module.
 */
export interface IBookingModuleService extends IModuleService {
  // -------------------- Service Methods --------------------

  /**
   * Creates services.
   *
   * @param data - The services to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created services.
   */
  createBookingServices(
    data: CreateServiceDTO[],
    sharedContext?: Context
  ): Promise<ServiceDTO[]>

  /**
   * Creates a service.
   *
   * @param data - The service to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created service.
   */
  createBookingServices(
    data: CreateServiceDTO,
    sharedContext?: Context
  ): Promise<ServiceDTO>

  /**
   * Updates existing services.
   *
   * @param data - The services to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated services.
   */
  updateBookingServices(
    data: UpdateServiceDTO[],
    sharedContext?: Context
  ): Promise<ServiceDTO[]>

  /**
   * Updates an existing service.
   *
   * @param data - The service to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated service.
   */
  updateBookingServices(
    data: UpdateServiceDTO,
    sharedContext?: Context
  ): Promise<ServiceDTO>

  /**
   * Deletes services by ID.
   *
   * @param ids - The IDs of the services to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingServices(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Deletes a service by ID.
   *
   * @param id - The ID of the service to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingServices(id: string, sharedContext?: Context): Promise<void>

  /**
   * Soft deletes services by ID.
   *
   * @param ids - The IDs of the services to soft delete.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The soft deleted services.
   */
  softDeleteBookingServices<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Restores soft deleted services.
   *
   * @param ids - The IDs of the services to restore.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The restored services.
   */
  restoreBookingServices<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Retrieves a service by ID.
   *
   * @param id - The ID of the service.
   * @param config - Configuration options for retrieval.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved service.
   */
  retrieveBookingService(
    id: string,
    config?: FindConfig<ServiceDTO>,
    sharedContext?: Context
  ): Promise<ServiceDTO>

  /**
   * Lists services based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of services.
   */
  listBookingServices(
    filters?: FilterableServiceProps,
    config?: FindConfig<ServiceDTO>,
    sharedContext?: Context
  ): Promise<ServiceDTO[]>

  /**
   * Lists and counts services based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns A tuple of the list of services and their count.
   */
  listAndCountBookingServices(
    filters?: FilterableServiceProps,
    config?: FindConfig<ServiceDTO>,
    sharedContext?: Context
  ): Promise<[ServiceDTO[], number]>

  // -------------------- Staff Methods --------------------

  /**
   * Creates staff members.
   *
   * @param data - The staff members to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created staff members.
   */
  createBookingStaffs(
    data: CreateStaffDTO[],
    sharedContext?: Context
  ): Promise<StaffDTO[]>

  /**
   * Creates a staff member.
   *
   * @param data - The staff member to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created staff member.
   */
  createBookingStaffs(data: CreateStaffDTO, sharedContext?: Context): Promise<StaffDTO>

  /**
   * Updates existing staff members.
   *
   * @param data - The staff members to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated staff members.
   */
  updateBookingStaffs(
    data: UpdateStaffDTO[],
    sharedContext?: Context
  ): Promise<StaffDTO[]>

  /**
   * Updates an existing staff member.
   *
   * @param data - The staff member to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated staff member.
   */
  updateBookingStaffs(data: UpdateStaffDTO, sharedContext?: Context): Promise<StaffDTO>

  /**
   * Deletes staff members by ID.
   *
   * @param ids - The IDs of the staff members to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingStaffs(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Deletes a staff member by ID.
   *
   * @param id - The ID of the staff member to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingStaffs(id: string, sharedContext?: Context): Promise<void>

  /**
   * Soft deletes staff members by ID.
   *
   * @param ids - The IDs of the staff members to soft delete.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The soft deleted staff members.
   */
  softDeleteBookingStaffs<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Restores soft deleted staff members.
   *
   * @param ids - The IDs of the staff members to restore.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The restored staff members.
   */
  restoreBookingStaffs<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Retrieves a staff member by ID.
   *
   * @param id - The ID of the staff member.
   * @param config - Configuration options for retrieval.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved staff member.
   */
  retrieveBookingStaff(
    id: string,
    config?: FindConfig<StaffDTO>,
    sharedContext?: Context
  ): Promise<StaffDTO>

  /**
   * Lists staff members based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of staff members.
   */
  listBookingStaffs(
    filters?: FilterableStaffProps,
    config?: FindConfig<StaffDTO>,
    sharedContext?: Context
  ): Promise<StaffDTO[]>

  /**
   * Lists and counts staff members based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns A tuple of the list of staff members and their count.
   */
  listAndCountBookingStaffs(
    filters?: FilterableStaffProps,
    config?: FindConfig<StaffDTO>,
    sharedContext?: Context
  ): Promise<[StaffDTO[], number]>

  // -------------------- Availability Rule Methods --------------------

  /**
   * Creates availability rules.
   *
   * @param data - The availability rules to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created availability rules.
   */
  createBookingAvailabilityRules(
    data: CreateAvailabilityRuleDTO[],
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO[]>

  /**
   * Creates an availability rule.
   *
   * @param data - The availability rule to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created availability rule.
   */
  createBookingAvailabilityRules(
    data: CreateAvailabilityRuleDTO,
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO>

  /**
   * Updates existing availability rules.
   *
   * @param data - The availability rules to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated availability rules.
   */
  updateBookingAvailabilityRules(
    data: UpdateAvailabilityRuleDTO[],
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO[]>

  /**
   * Updates an existing availability rule.
   *
   * @param data - The availability rule to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated availability rule.
   */
  updateBookingAvailabilityRules(
    data: UpdateAvailabilityRuleDTO,
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO>

  /**
   * Deletes availability rules by ID.
   *
   * @param ids - The IDs of the availability rules to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingAvailabilityRules(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Deletes an availability rule by ID.
   *
   * @param id - The ID of the availability rule to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingAvailabilityRules(id: string, sharedContext?: Context): Promise<void>

  /**
   * Soft deletes availability rules by ID.
   *
   * @param ids - The IDs of the availability rules to soft delete.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The soft deleted availability rules.
   */
  softDeleteBookingAvailabilityRules<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Restores soft deleted availability rules.
   *
   * @param ids - The IDs of the availability rules to restore.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The restored availability rules.
   */
  restoreBookingAvailabilityRules<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Retrieves an availability rule by ID.
   *
   * @param id - The ID of the availability rule.
   * @param config - Configuration options for retrieval.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved availability rule.
   */
  retrieveBookingAvailabilityRule(
    id: string,
    config?: FindConfig<AvailabilityRuleDTO>,
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO>

  /**
   * Lists availability rules based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of availability rules.
   */
  listBookingAvailabilityRules(
    filters?: FilterableAvailabilityRuleProps,
    config?: FindConfig<AvailabilityRuleDTO>,
    sharedContext?: Context
  ): Promise<AvailabilityRuleDTO[]>

  /**
   * Lists and counts availability rules based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns A tuple of the list of availability rules and their count.
   */
  listAndCountBookingAvailabilityRules(
    filters?: FilterableAvailabilityRuleProps,
    config?: FindConfig<AvailabilityRuleDTO>,
    sharedContext?: Context
  ): Promise<[AvailabilityRuleDTO[], number]>

  // -------------------- Booking Settings Methods --------------------

  /**
   * Gets the booking settings.
   *
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The booking settings.
   */
  getSettings(sharedContext?: Context): Promise<BookingSettingsDTO>

  /**
   * Updates the booking settings.
   *
   * @param data - The settings to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated booking settings.
   */
  updateSettings(
    data: UpdateBookingSettingsDTO,
    sharedContext?: Context
  ): Promise<BookingSettingsDTO>

  // -------------------- Booking Methods --------------------

  /**
   * Creates bookings.
   *
   * @param data - The bookings to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created bookings.
   */
  createBookingRecords(
    data: CreateBookingDTO[],
    sharedContext?: Context
  ): Promise<BookingDTO[]>

  /**
   * Creates a booking.
   *
   * @param data - The booking to create.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created booking.
   */
  createBookingRecords(
    data: CreateBookingDTO,
    sharedContext?: Context
  ): Promise<BookingDTO>

  /**
   * Updates existing bookings.
   *
   * @param data - The bookings to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated bookings.
   */
  updateBookingRecords(
    data: UpdateBookingDTO[],
    sharedContext?: Context
  ): Promise<BookingDTO[]>

  /**
   * Updates an existing booking.
   *
   * @param data - The booking to update.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated booking.
   */
  updateBookingRecords(
    data: UpdateBookingDTO,
    sharedContext?: Context
  ): Promise<BookingDTO>

  /**
   * Deletes bookings by ID.
   *
   * @param ids - The IDs of the bookings to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingRecords(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Deletes a booking by ID.
   *
   * @param id - The ID of the booking to delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  deleteBookingRecords(id: string, sharedContext?: Context): Promise<void>

  /**
   * Soft deletes bookings by ID.
   *
   * @param ids - The IDs of the bookings to soft delete.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The soft deleted bookings.
   */
  softDeleteBookingRecords<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Restores soft deleted bookings.
   *
   * @param ids - The IDs of the bookings to restore.
   * @param config - Configuration options.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The restored bookings.
   */
  restoreBookingRecords<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * Retrieves a booking by ID.
   *
   * @param id - The ID of the booking.
   * @param config - Configuration options for retrieval.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved booking.
   */
  retrieveBookingRecord(
    id: string,
    config?: FindConfig<BookingDTO>,
    sharedContext?: Context
  ): Promise<BookingDTO>

  /**
   * Lists bookings based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of bookings.
   */
  listBookingRecords(
    filters?: FilterableBookingProps,
    config?: FindConfig<BookingDTO>,
    sharedContext?: Context
  ): Promise<BookingDTO[]>

  /**
   * Lists and counts bookings based on filters.
   *
   * @param filters - The filters to apply.
   * @param config - Configuration options for the query.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns A tuple of the list of bookings and their count.
   */
  listAndCountBookingRecords(
    filters?: FilterableBookingProps,
    config?: FindConfig<BookingDTO>,
    sharedContext?: Context
  ): Promise<[BookingDTO[], number]>

  // -------------------- Utility Methods --------------------

  /**
   * Seeds default data for the booking module.
   *
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   */
  seedDefaultData(sharedContext?: Context): Promise<void>

  // -------------------- Availability Methods --------------------

  /**
   * Gets available time slots for a given date and service.
   * Returns all available 15-minute slots that can accommodate the service duration.
   *
   * @param input - The availability query parameters.
   * @param input.date - The date to check availability for.
   * @param input.service_id - The ID of the service to check availability for.
   * @param input.staff_id - Optional: specific staff member to check. If omitted, returns slots for all active staff.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns An array of available time slots.
   */
  getAvailableSlots(
    input: GetAvailableSlotsInput,
    sharedContext?: Context
  ): Promise<AvailableSlotDTO[]>

  /**
   * Checks if a specific time slot is available for booking.
   * Validates against staff availability rules and existing bookings.
   *
   * @param input - The slot to check.
   * @param input.staff_id - The ID of the staff member.
   * @param input.start_at - The start time of the slot.
   * @param input.end_at - The end time of the slot.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns True if the slot is available, false otherwise.
   */
  checkSlotAvailability(
    input: CheckSlotAvailabilityInput,
    sharedContext?: Context
  ): Promise<boolean>
}
