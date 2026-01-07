import { RouteFocusModal } from "../../../../components/modals"
import { CreateStaffForm } from "./components/create-staff-form"

export const StaffCreate = () => {
  return (
    <RouteFocusModal>
      <CreateStaffForm />
    </RouteFocusModal>
  )
}
