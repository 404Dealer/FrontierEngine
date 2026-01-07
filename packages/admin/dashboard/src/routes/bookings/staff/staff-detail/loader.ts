import { LoaderFunctionArgs } from "react-router-dom"
import { bookingStaffQueryKeys } from "../../../../hooks/api/bookings"
import { sdk } from "../../../../lib/client"
import { queryClient } from "../../../../lib/query-client"

const staffDetailQuery = (id: string) => ({
  queryKey: bookingStaffQueryKeys.detail(id),
  queryFn: async () =>
    sdk.client.fetch(`/admin/bookings/staff/${id}`, {
      method: "GET",
      query: {
        fields: "+availability_rules",
      },
    }),
})

export const staffLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = staffDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
