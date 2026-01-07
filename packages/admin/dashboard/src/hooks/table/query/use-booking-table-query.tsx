import { useQueryParams } from "../../use-query-params"

type UseBookingTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useBookingTableQuery = ({
  prefix,
  pageSize = 20,
}: UseBookingTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "status",
      "staff_id",
      "service_id",
      "start_at",
      "order",
      "created_at",
      "updated_at",
    ],
    prefix
  )

  const {
    offset,
    status,
    staff_id,
    service_id,
    start_at,
    q,
    order,
    created_at,
    updated_at,
  } = queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status?.split(","),
    staff_id: staff_id?.split(","),
    service_id: service_id?.split(","),
    order,
    start_at: start_at ? JSON.parse(start_at) : undefined,
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
