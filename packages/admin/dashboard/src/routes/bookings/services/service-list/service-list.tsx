import { Outlet } from "react-router-dom"
import { SingleColumnPage } from "../../../../components/layout/pages"
import { useExtension } from "../../../../providers/extension-provider"
import { ServiceListTable } from "./components/service-list-table"

export const ServiceList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("booking.service.list.before"),
        after: getWidgets("booking.service.list.after"),
      }}
    >
      <ServiceListTable />
      <Outlet />
    </SingleColumnPage>
  )
}
