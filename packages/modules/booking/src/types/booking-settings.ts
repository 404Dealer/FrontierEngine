export interface BookingSettingsDTO {
  id: string
  allow_guest_bookings: boolean
  default_hold_duration_minutes: number
  cancellation_window_hours: number
  timezone: string
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface UpdateBookingSettingsDTO {
  allow_guest_bookings?: boolean
  default_hold_duration_minutes?: number
  cancellation_window_hours?: number
  timezone?: string
  metadata?: Record<string, unknown> | null
}
