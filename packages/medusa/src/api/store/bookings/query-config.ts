export const storeServiceFields = [
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
]

export const storeServiceListConfig = {
  defaults: storeServiceFields,
  isList: true,
}

export const storeAvailabilityFields = [
  "start_at",
  "end_at",
  "staff_id",
  "staff_name",
  "service_id",
]

export const QueryConfig = {
  listServicesTransformQueryConfig: {
    defaults: storeServiceFields,
    isList: true,
  },
}
