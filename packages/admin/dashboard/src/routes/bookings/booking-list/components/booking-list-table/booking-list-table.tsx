import { PencilSquare, Trash } from "@medusajs/icons"
import { Button, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  AdminBooking,
  useBookings,
  useDeleteBooking,
} from "../../../../../hooks/api/bookings"
import { useBookingTableColumns } from "../../../../../hooks/table/columns/use-booking-table-columns"
import { useBookingTableFilters } from "../../../../../hooks/table/filters/use-booking-table-filters"
import { useBookingTableQuery } from "../../../../../hooks/table/query/use-booking-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const BookingListTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useBookingTableQuery({ pageSize: PAGE_SIZE })
  const { bookings, count, isLoading, isError, error } = useBookings(
    {
      ...searchParams,
      fields: "+staff.name",
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = useBookingTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: bookings ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("bookings.domain")}</Heading>
        <Link to="/bookings/create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        orderBy={[
          { key: "start_at", label: t("bookings.fields.startAt") },
          { key: "display_id", label: t("bookings.fields.displayId") },
          { key: "status", label: t("bookings.fields.status") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        isLoading={isLoading}
        navigateTo={(row) => row.original.id}
        search
        queryObject={raw}
        noRecords={{
          message: t("bookings.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}

const BookingActions = ({ booking }: { booking: AdminBooking }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: deleteBooking } = useDeleteBooking(booking.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("bookings.delete.title"),
      description: t("bookings.delete.description", {
        displayId: booking.display_id,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await deleteBooking(undefined, {
      onSuccess: () => {
        toast.success(
          t("bookings.delete.successToast", {
            displayId: booking.display_id,
          })
        )
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/bookings/${booking.id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminBooking>()

const useColumns = () => {
  const columns = useBookingTableColumns()

  return useMemo(
    () => [
      ...columns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <BookingActions booking={row.original} />,
      }),
    ],
    [columns]
  )
}
