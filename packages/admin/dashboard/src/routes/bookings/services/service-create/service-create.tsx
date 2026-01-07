import { RouteFocusModal } from "../../../../components/modals"
import { CreateServiceForm } from "./components/create-service-form"

export const ServiceCreate = () => {
  return (
    <RouteFocusModal>
      <CreateServiceForm />
    </RouteFocusModal>
  )
}
