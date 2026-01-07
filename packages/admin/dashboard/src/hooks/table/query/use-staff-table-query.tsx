import { useQueryParams } from "../../use-query-params"

type UseStaffTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useStaffTableQuery = ({
  prefix,
  pageSize = 50,
}: UseStaffTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "is_active", "order", "created_at", "updated_at"],
    prefix
  )

  const { offset, is_active, q, order, created_at, updated_at } = queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    is_active: is_active === "true" ? true : is_active === "false" ? false : undefined,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    q,
  }

  // Remove undefined values
  Object.keys(searchParams).forEach((key) => {
    if (searchParams[key] === undefined) {
      delete searchParams[key]
    }
  })

  return {
    searchParams,
    raw: queryObject,
  }
}
