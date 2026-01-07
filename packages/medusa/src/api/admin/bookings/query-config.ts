export const defaultAdminBookingFields = [
  "id",
  "display_id",
  "staff_id",
  "service_id",
  "customer_id",
  "start_at",
  "end_at",
  "status",
  "service_name",
  "price_amount",
  "currency_code",
  "customer_name",
  "customer_email",
  "customer_phone",
  "metadata",
  "created_at",
  "updated_at",
]

export const defaultAdminRetrieveBookingFields = [
  ...defaultAdminBookingFields,
  "hold_expires_at",
  "deposit_amount",
  "payment_mode",
  "amount_paid",
  "notes",
  "internal_notes",
  "confirmed_at",
  "cancelled_at",
  "completed_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminRetrieveBookingFields,
  isList: false,
}

export const listTransformQueryConfig = {
  defaults: defaultAdminBookingFields,
  defaultLimit: 20,
  isList: true,
}

// Service query config
export const defaultAdminServiceFields = [
  "id",
  "name",
  "description",
  "duration_minutes",
  "buffer_minutes",
  "price",
  "currency_code",
  "deposit_type",
  "deposit_value",
  "payment_modes_allowed",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
]

export const serviceListTransformQueryConfig = {
  defaults: defaultAdminServiceFields,
  defaultLimit: 50,
  isList: true,
}

export const serviceRetrieveTransformQueryConfig = {
  defaults: defaultAdminServiceFields,
  isList: false,
}

// Staff query config
export const defaultAdminStaffFields = [
  "id",
  "name",
  "email",
  "phone",
  "bio",
  "avatar_url",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
]

export const staffListTransformQueryConfig = {
  defaults: defaultAdminStaffFields,
  defaultLimit: 50,
  isList: true,
}

export const staffRetrieveTransformQueryConfig = {
  defaults: defaultAdminStaffFields,
  isList: false,
}

// Booking settings query config
export const defaultAdminBookingSettingsFields = [
  "id",
  "allow_guest_bookings",
  "default_hold_duration_minutes",
  "cancellation_window_hours",
  "timezone",
  "metadata",
  "created_at",
  "updated_at",
]

export const settingsTransformQueryConfig = {
  defaults: defaultAdminBookingSettingsFields,
  isList: false,
}

// Availability rule query config
export const defaultAdminAvailabilityRuleFields = [
  "id",
  "staff_id",
  "rule_type",
  "day_of_week",
  "specific_date",
  "start_time",
  "end_time",
  "is_available",
  "metadata",
  "created_at",
  "updated_at",
]

export const availabilityRuleListTransformQueryConfig = {
  defaults: defaultAdminAvailabilityRuleFields,
  defaultLimit: 50,
  isList: true,
}

export const availabilityRuleRetrieveTransformQueryConfig = {
  defaults: defaultAdminAvailabilityRuleFields,
  isList: false,
}
