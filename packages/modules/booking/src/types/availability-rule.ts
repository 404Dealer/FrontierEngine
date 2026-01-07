import type { BaseFilterable, OperatorMap } from "@medusajs/framework/types"
import { DayOfWeek, RuleType } from "@models"

export interface AvailabilityRuleDTO {
  id: string
  staff_id: string
  rule_type: RuleType
  day_of_week: DayOfWeek | null
  specific_date: Date | null
  start_time: string
  end_time: string
  is_available: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateAvailabilityRuleDTO {
  staff_id: string
  rule_type?: RuleType
  day_of_week?: DayOfWeek | null
  specific_date?: Date | string | null
  start_time: string
  end_time: string
  is_available?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateAvailabilityRuleDTO {
  id: string
  rule_type?: RuleType
  day_of_week?: DayOfWeek | null
  specific_date?: Date | string | null
  start_time?: string
  end_time?: string
  is_available?: boolean
  metadata?: Record<string, unknown> | null
}

export type FilterableAvailabilityRuleProps =
  BaseFilterable<AvailabilityRuleDTO> & {
    id?: string | string[] | OperatorMap<string>
    staff_id?: string | string[]
    rule_type?: RuleType | RuleType[]
    day_of_week?: DayOfWeek | DayOfWeek[]
    is_available?: boolean
  }
