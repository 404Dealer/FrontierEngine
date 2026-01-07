import type { BaseFilterable, OperatorMap } from "@medusajs/framework/types"
import { BigNumberInput } from "@medusajs/framework/types"
import { DepositType, PaymentModeAllowed } from "@models"

export interface ServiceDTO {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  buffer_minutes: number
  price: BigNumberInput
  currency_code: string
  deposit_type: DepositType
  deposit_value: BigNumberInput | null
  payment_modes_allowed: PaymentModeAllowed[]
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateServiceDTO {
  name: string
  description?: string | null
  duration_minutes?: number
  buffer_minutes?: number
  price: BigNumberInput
  currency_code?: string
  deposit_type?: DepositType
  deposit_value?: BigNumberInput | null
  payment_modes_allowed?: PaymentModeAllowed[]
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateServiceDTO {
  id: string
  name?: string
  description?: string | null
  duration_minutes?: number
  buffer_minutes?: number
  price?: BigNumberInput
  currency_code?: string
  deposit_type?: DepositType
  deposit_value?: BigNumberInput | null
  payment_modes_allowed?: PaymentModeAllowed[]
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export type FilterableServiceProps = BaseFilterable<ServiceDTO> & {
  id?: string | string[] | OperatorMap<string>
  name?: string | OperatorMap<string>
  is_active?: boolean
  currency_code?: string | string[]
}
