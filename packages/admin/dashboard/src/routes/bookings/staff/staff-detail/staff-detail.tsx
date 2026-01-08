import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../../components/common/skeleton"
import { TwoColumnPage } from "../../../../components/layout/pages"
import {
  AdminBookingStaffResponse,
  useBookingStaffMember,
} from "../../../../hooks/api/bookings"
import { StaffAvailabilitySection } from "./components/staff-availability-section"
import { StaffGeneralSection } from "./components/staff-general-section"
import { staffLoader } from "./loader"

export const StaffDetail = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<ReturnType<typeof staffLoader>>
  const { staff, isLoading, isError, error } = useBookingStaffMember(
    id!,
    { fields: "+availability_rules" },
    { initialData: initialData as AdminBookingStaffResponse }
  )

  if (isLoading || !staff) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        before: [],
        after: [],
        sideBefore: [],
        sideAfter: [],
      }}
      data={staff}
      hasOutlet
      showJSON
      showMetadata
    >
      <TwoColumnPage.Main>
        <StaffGeneralSection staff={staff} />
        <StaffAvailabilitySection staff={staff} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {/* Avatar and quick info can go here */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
