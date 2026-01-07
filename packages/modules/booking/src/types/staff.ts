import type { BaseFilterable, OperatorMap } from "@medusajs/framework/types"

export interface StaffDTO {
  id: string
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateStaffDTO {
  name: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateStaffDTO {
  id: string
  name?: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export type FilterableStaffProps = BaseFilterable<StaffDTO> & {
  id?: string | string[] | OperatorMap<string>
  name?: string | OperatorMap<string>
  email?: string | OperatorMap<string>
  is_active?: boolean
}
