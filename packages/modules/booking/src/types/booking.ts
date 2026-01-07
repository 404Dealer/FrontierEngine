import type { BaseFilterable, OperatorMap } from "@medusajs/framework/types"
import { BigNumberInput } from "@medusajs/framework/types"
import { BookingStatus, PaymentMode } from "@models"

export interface BookingDTO {
  id: string
  display_id: number
  staff_id: string
  service_id: string
  customer_id: string | null

  start_at: Date
  end_at: Date

  status: BookingStatus
  hold_expires_at: Date | null

  service_name: string
  price_amount: BigNumberInput
  currency_code: string
  deposit_amount: BigNumberInput | null

  payment_mode: PaymentMode | null
  amount_paid: BigNumberInput | null

  customer_email: string | null
  customer_phone: string | null
  customer_name: string | null

  notes: string | null
  internal_notes: string | null

  confirmed_at: Date | null
  cancelled_at: Date | null
  completed_at: Date | null

  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateBookingDTO {
  staff_id: string
  service_id: string
  customer_id?: string | null

  start_at: Date | string
  end_at: Date | string

  status?: BookingStatus
  hold_expires_at?: Date | string | null

  service_name: string
  price_amount: BigNumberInput
  currency_code: string
  deposit_amount?: BigNumberInput | null

  payment_mode?: PaymentMode | null
  amount_paid?: BigNumberInput | null

  customer_email?: string | null
  customer_phone?: string | null
  customer_name?: string | null

  notes?: string | null
  internal_notes?: string | null

  metadata?: Record<string, unknown> | null
}

export interface UpdateBookingDTO {
  id: string
  status?: BookingStatus
  hold_expires_at?: Date | string | null
  payment_mode?: PaymentMode | null
  amount_paid?: BigNumberInput | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_name?: string | null
  notes?: string | null
  internal_notes?: string | null
  confirmed_at?: Date | string | null
  cancelled_at?: Date | string | null
  completed_at?: Date | string | null
  metadata?: Record<string, unknown> | null
}

export type FilterableBookingProps = BaseFilterable<BookingDTO> & {
  id?: string | string[] | OperatorMap<string>
  display_id?: number | OperatorMap<number>
  staff_id?: string | string[]
  service_id?: string | string[]
  customer_id?: string | string[] | null
  status?: BookingStatus | BookingStatus[]
  start_at?: Date | OperatorMap<Date>
  end_at?: Date | OperatorMap<Date>
  customer_email?: string | OperatorMap<string>
}
