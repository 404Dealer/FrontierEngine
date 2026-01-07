import { Outlet } from "react-router-dom"
import { SingleColumnPage } from "../../../../components/layout/pages"
import { useExtension } from "../../../../providers/extension-provider"
import { StaffListTable } from "./components/staff-list-table"

export const StaffList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("booking.staff.list.before"),
        after: getWidgets("booking.staff.list.after"),
      }}
    >
      <StaffListTable />
      <Outlet />
    </SingleColumnPage>
  )
}
