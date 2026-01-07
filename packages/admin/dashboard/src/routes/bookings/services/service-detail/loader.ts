import { LoaderFunctionArgs } from "react-router-dom"
import { bookingServicesQueryKeys, AdminBookingServiceResponse } from "../../../../hooks/api/bookings"
import { sdk } from "../../../../lib/client"
import { queryClient } from "../../../../lib/query-client"

const serviceDetailQuery = (id: string) => ({
  queryKey: bookingServicesQueryKeys.detail(id),
  queryFn: async () =>
    sdk.client.fetch<AdminBookingServiceResponse>(
      `/admin/bookings/services/${id}`
    ),
})

export const serviceLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!
  const query = serviceDetailQuery(id)

  return (
    queryClient.getQueryData<AdminBookingServiceResponse>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
