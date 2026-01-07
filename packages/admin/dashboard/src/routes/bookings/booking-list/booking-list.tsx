import { Outlet } from "react-router-dom"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { BookingListTable } from "./components/booking-list-table"

export const BookingList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("booking.list.before"),
        after: getWidgets("booking.list.after"),
      }}
    >
      <BookingListTable />
      <Outlet />
    </SingleColumnPage>
  )
}
