import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { AdminBookingResponse, useBooking } from "../../../hooks/api/bookings"
import { BookingCustomerSection } from "./components/booking-customer-section"
import { BookingGeneralSection } from "./components/booking-general-section"
import { BookingPaymentSection } from "./components/booking-payment-section"
import { bookingLoader } from "./loader"

export const BookingDetail = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof bookingLoader>
  >
  const { booking, isLoading, isError, error } = useBooking(
    id!,
    { fields: "+staff.name,+staff.email" },
    { initialData: initialData as AdminBookingResponse }
  )

  if (isLoading || !booking) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage data={booking} hasOutlet showJSON showMetadata>
      <TwoColumnPage.Main>
        <BookingGeneralSection booking={booking} />
        <BookingCustomerSection booking={booking} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <BookingPaymentSection booking={booking} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
