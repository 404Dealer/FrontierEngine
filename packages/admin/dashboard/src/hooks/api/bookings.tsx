import { FetchError } from "@medusajs/js-sdk"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

// -------------------- Types --------------------

// Booking Types
export interface AdminBooking {
  id: string
  display_id: number
  staff_id: string
  service_id: string
  customer_id: string | null
  start_at: string
  end_at: string
  status: "held" | "confirmed" | "cancelled" | "completed" | "no_show"
  hold_expires_at: string | null
  service_name: string
  price_amount: string | number
  currency_code: string
  deposit_amount: string | number | null
  payment_mode: "pay_in_store" | "deposit" | "full" | null
  amount_paid: string | number | null
  customer_email: string | null
  customer_phone: string | null
  customer_name: string | null
  notes: string | null
  internal_notes: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  staff?: AdminBookingStaff
}

export interface AdminBookingService {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  buffer_minutes: number
  price: string | number
  currency_code: string
  deposit_type: "none" | "fixed" | "percent"
  deposit_value: string | number | null
  payment_modes_allowed: string[]
  is_active: boolean
  region_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AdminBookingStaff {
  id: string
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  availability_rules?: AdminAvailabilityRule[]
}

export interface AdminAvailabilityRule {
  id: string
  staff_id: string
  rule_type: "recurring" | "exception" | "blocked"
  day_of_week: number | null
  specific_date: string | null
  start_time: string
  end_time: string
  is_available: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AdminBookingSettings {
  id: string
  allow_guest_bookings: boolean
  default_hold_duration_minutes: number
  cancellation_window_hours: number
  timezone: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Request/Response Types
export interface AdminBookingsResponse {
  bookings: AdminBooking[]
  count: number
  offset: number
  limit: number
}

export interface AdminBookingResponse {
  booking: AdminBooking
}

export interface AdminBookingServicesResponse {
  services: AdminBookingService[]
  count: number
  offset: number
  limit: number
}

export interface AdminBookingServiceResponse {
  service: AdminBookingService
}

export interface AdminBookingStaffListResponse {
  staff: AdminBookingStaff[]
  count: number
  offset: number
  limit: number
}

export interface AdminBookingStaffResponse {
  staff: AdminBookingStaff
}

export interface AdminBookingSettingsResponse {
  settings: AdminBookingSettings
}

// Input Types
export interface AdminCreateBookingInput {
  staff_id: string
  service_id: string
  customer_id?: string | null
  start_at: string | Date
  end_at: string | Date
  status?: string
  hold_expires_at?: string | Date | null
  service_name: string
  price_amount: string | number
  currency_code: string
  deposit_amount?: string | number | null
  payment_mode?: string | null
  amount_paid?: string | number | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_name?: string | null
  notes?: string | null
  internal_notes?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateBookingInput {
  status?: string
  hold_expires_at?: string | Date | null
  payment_mode?: string | null
  amount_paid?: string | number | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_name?: string | null
  notes?: string | null
  internal_notes?: string | null
  confirmed_at?: string | Date | null
  cancelled_at?: string | Date | null
  completed_at?: string | Date | null
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateServiceInput {
  name: string
  description?: string | null
  duration_minutes?: number
  buffer_minutes?: number
  price: string | number
  currency_code?: string
  deposit_type?: "none" | "fixed" | "percent"
  deposit_value?: string | number | null
  payment_modes_allowed?: string[]
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateServiceInput {
  name?: string
  description?: string | null
  duration_minutes?: number
  buffer_minutes?: number
  price?: string | number
  currency_code?: string
  deposit_type?: "none" | "fixed" | "percent"
  deposit_value?: string | number | null
  payment_modes_allowed?: string[]
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateStaffInput {
  name: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateStaffInput {
  name?: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateBookingSettingsInput {
  allow_guest_bookings?: boolean
  default_hold_duration_minutes?: number
  cancellation_window_hours?: number
  timezone?: string
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateAvailabilityRuleInput {
  staff_id: string
  rule_type: "recurring" | "exception" | "blocked"
  day_of_week?: number | null
  specific_date?: string | null
  start_time: string
  end_time: string
  is_available?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateAvailabilityRuleInput {
  rule_type?: "recurring" | "exception" | "blocked"
  day_of_week?: number | null
  specific_date?: string | null
  start_time?: string
  end_time?: string
  is_available?: boolean
  metadata?: Record<string, unknown> | null
}

// -------------------- Query Keys --------------------

const BOOKINGS_QUERY_KEY = "bookings" as const
export const bookingsQueryKeys = queryKeysFactory(BOOKINGS_QUERY_KEY)

const BOOKING_SERVICES_QUERY_KEY = "booking_services" as const
export const bookingServicesQueryKeys = queryKeysFactory(
  BOOKING_SERVICES_QUERY_KEY
)

const BOOKING_STAFF_QUERY_KEY = "booking_staff" as const
export const bookingStaffQueryKeys = queryKeysFactory(BOOKING_STAFF_QUERY_KEY)

const BOOKING_SETTINGS_QUERY_KEY = "booking_settings" as const
export const bookingSettingsQueryKeys = queryKeysFactory(
  BOOKING_SETTINGS_QUERY_KEY
)

// -------------------- Booking Hooks --------------------

export const useBookings = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<AdminBookingsResponse, FetchError, AdminBookingsResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingsResponse>("/admin/bookings", {
        method: "GET",
        query,
      }),
    queryKey: bookingsQueryKeys.list(query),
    ...options,
  })

  return {
    bookings: data?.bookings,
    count: data?.count,
    offset: data?.offset,
    limit: data?.limit,
    ...rest,
  }
}

export const useBooking = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<AdminBookingResponse, FetchError, AdminBookingResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingResponse>(`/admin/bookings/${id}`, {
        method: "GET",
        query,
      }),
    queryKey: bookingsQueryKeys.detail(id, query),
    ...options,
  })

  return {
    booking: data?.booking,
    ...rest,
  }
}

export const useCreateBooking = (
  options?: UseMutationOptions<
    AdminBookingResponse,
    FetchError,
    AdminCreateBookingInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminCreateBookingInput) =>
      sdk.client.fetch<AdminBookingResponse>("/admin/bookings", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBooking = (
  id: string,
  options?: UseMutationOptions<
    AdminBookingResponse,
    FetchError,
    AdminUpdateBookingInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminUpdateBookingInput) =>
      sdk.client.fetch<AdminBookingResponse>(`/admin/bookings/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBooking = (
  id: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(`/admin/bookings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// -------------------- Service Hooks --------------------

export const useBookingServices = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBookingServicesResponse,
      FetchError,
      AdminBookingServicesResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingServicesResponse>("/admin/bookings/services", {
        method: "GET",
        query,
      }),
    queryKey: bookingServicesQueryKeys.list(query),
    ...options,
  })

  return {
    services: data?.services,
    count: data?.count,
    offset: data?.offset,
    limit: data?.limit,
    ...rest,
  }
}

export const useBookingService = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBookingServiceResponse,
      FetchError,
      AdminBookingServiceResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingServiceResponse>(
        `/admin/bookings/services/${id}`,
        {
          method: "GET",
          query,
        }
      ),
    queryKey: bookingServicesQueryKeys.detail(id, query),
    ...options,
  })

  return {
    service: data?.service,
    ...rest,
  }
}

export const useCreateBookingService = (
  options?: UseMutationOptions<
    AdminBookingServiceResponse,
    FetchError,
    AdminCreateServiceInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminCreateServiceInput) =>
      sdk.client.fetch<AdminBookingServiceResponse>("/admin/bookings/services", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingServicesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBookingService = (
  id: string,
  options?: UseMutationOptions<
    AdminBookingServiceResponse,
    FetchError,
    AdminUpdateServiceInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminUpdateServiceInput) =>
      sdk.client.fetch<AdminBookingServiceResponse>(
        `/admin/bookings/services/${id}`,
        {
          method: "POST",
          body: payload,
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingServicesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: bookingServicesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBookingService = (
  id: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/bookings/services/${id}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingServicesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: bookingServicesQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// -------------------- Staff Hooks --------------------

export const useBookingStaff = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBookingStaffListResponse,
      FetchError,
      AdminBookingStaffListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingStaffListResponse>("/admin/bookings/staff", {
        method: "GET",
        query,
      }),
    queryKey: bookingStaffQueryKeys.list(query),
    ...options,
  })

  return {
    staff: data?.staff,
    count: data?.count,
    offset: data?.offset,
    limit: data?.limit,
    ...rest,
  }
}

export const useBookingStaffMember = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBookingStaffResponse,
      FetchError,
      AdminBookingStaffResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingStaffResponse>(`/admin/bookings/staff/${id}`, {
        method: "GET",
        query,
      }),
    queryKey: bookingStaffQueryKeys.detail(id, query),
    ...options,
  })

  return {
    staff: data?.staff,
    ...rest,
  }
}

export const useCreateBookingStaff = (
  options?: UseMutationOptions<
    AdminBookingStaffResponse,
    FetchError,
    AdminCreateStaffInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminCreateStaffInput) =>
      sdk.client.fetch<AdminBookingStaffResponse>("/admin/bookings/staff", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBookingStaff = (
  id: string,
  options?: UseMutationOptions<
    AdminBookingStaffResponse,
    FetchError,
    AdminUpdateStaffInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminUpdateStaffInput) =>
      sdk.client.fetch<AdminBookingStaffResponse>(`/admin/bookings/staff/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBookingStaff = (
  id: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/bookings/staff/${id}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// -------------------- Settings Hooks --------------------

export const useBookingSettings = (
  options?: Omit<
    UseQueryOptions<
      AdminBookingSettingsResponse,
      FetchError,
      AdminBookingSettingsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.client.fetch<AdminBookingSettingsResponse>("/admin/bookings/settings", {
        method: "GET",
      }),
    queryKey: bookingSettingsQueryKeys.all,
    ...options,
  })

  return {
    settings: data?.settings,
    ...rest,
  }
}

export const useUpdateBookingSettings = (
  options?: UseMutationOptions<
    AdminBookingSettingsResponse,
    FetchError,
    AdminUpdateBookingSettingsInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminUpdateBookingSettingsInput) =>
      sdk.client.fetch<AdminBookingSettingsResponse>("/admin/bookings/settings", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingSettingsQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// -------------------- Availability Rule Hooks --------------------

export const useCreateAvailabilityRule = (
  staffId: string,
  options?: UseMutationOptions<
    { rule: AdminAvailabilityRule },
    FetchError,
    Omit<AdminCreateAvailabilityRuleInput, "staff_id">
  >
) => {
  return useMutation({
    mutationFn: (payload: Omit<AdminCreateAvailabilityRuleInput, "staff_id">) =>
      sdk.client.fetch<{ rule: AdminAvailabilityRule }>(
        `/admin/bookings/staff/${staffId}/availability`,
        {
          method: "POST",
          body: { ...payload, staff_id: staffId },
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.detail(staffId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateAvailabilityRule = (
  staffId: string,
  ruleId: string,
  options?: UseMutationOptions<
    { rule: AdminAvailabilityRule },
    FetchError,
    AdminUpdateAvailabilityRuleInput
  >
) => {
  return useMutation({
    mutationFn: (payload: AdminUpdateAvailabilityRuleInput) =>
      sdk.client.fetch<{ rule: AdminAvailabilityRule }>(
        `/admin/bookings/staff/${staffId}/availability/${ruleId}`,
        {
          method: "POST",
          body: payload,
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.detail(staffId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteAvailabilityRule = (
  staffId: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, string>
) => {
  return useMutation({
    mutationFn: (ruleId: string) =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/bookings/staff/${staffId}/availability/${ruleId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: bookingStaffQueryKeys.detail(staffId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
