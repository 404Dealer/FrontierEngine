import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"
import { useBookingStaff, useBookingServices } from "../../api/bookings"

export const useBookingTableFilters = () => {
  const { t } = useTranslation()

  const { staff } = useBookingStaff(
    { limit: 100 },
    { staleTime: 60 * 1000 }
  )

  const { services } = useBookingServices(
    { limit: 100 },
    { staleTime: 60 * 1000 }
  )

  let filters: Filter[] = []

  // Status filter
  const statusFilter: Filter = {
    key: "status",
    label: t("bookings.fields.status"),
    type: "select",
    multiple: true,
    options: [
      { label: t("bookings.status.held"), value: "held" },
      { label: t("bookings.status.confirmed"), value: "confirmed" },
      { label: t("bookings.status.completed"), value: "completed" },
      { label: t("bookings.status.cancelled"), value: "cancelled" },
      { label: t("bookings.status.no_show"), value: "no_show" },
    ],
  }

  filters.push(statusFilter)

  // Staff filter
  if (staff?.length) {
    const staffFilter: Filter = {
      key: "staff_id",
      label: t("bookings.fields.staff"),
      type: "select",
      multiple: true,
      options: staff.map((s) => ({
        label: s.name,
        value: s.id,
      })),
    }
    filters.push(staffFilter)
  }

  // Service filter
  if (services?.length) {
    const serviceFilter: Filter = {
      key: "service_id",
      label: t("bookings.fields.service"),
      type: "select",
      multiple: true,
      options: services.map((s) => ({
        label: s.name,
        value: s.id,
      })),
    }
    filters.push(serviceFilter)
  }

  // Date filters
  const dateFilters: Filter[] = [
    { label: t("bookings.fields.startAt"), key: "start_at" },
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }))

  filters = [...filters, ...dateFilters]

  return filters
}
