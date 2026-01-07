import { LoaderFunctionArgs } from "react-router-dom"
import { bookingsQueryKeys } from "../../../hooks/api/bookings"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const bookingDetailQuery = (id: string) => ({
  queryKey: bookingsQueryKeys.detail(id),
  queryFn: async () =>
    sdk.client.fetch(`/admin/bookings/${id}`, {
      method: "GET",
      query: {
        fields: "+staff.name,+staff.email",
      },
    }),
})

export const bookingLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = bookingDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
