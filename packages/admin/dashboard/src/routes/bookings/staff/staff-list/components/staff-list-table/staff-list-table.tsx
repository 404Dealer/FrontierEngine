import { PencilSquare, Trash } from "@medusajs/icons"
import { Button, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../../components/table/data-table"
import {
  AdminBookingStaff,
  useBookingStaff,
  useDeleteBookingStaff,
} from "../../../../../../hooks/api/bookings"
import { useStaffTableColumns } from "../../../../../../hooks/table/columns/use-staff-table-columns"
import { useStaffTableQuery } from "../../../../../../hooks/table/query/use-staff-table-query"
import { useDataTable } from "../../../../../../hooks/use-data-table"

const PAGE_SIZE = 50

export const StaffListTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useStaffTableQuery({ pageSize: PAGE_SIZE })
  const { staff, count, isLoading, isError, error } = useBookingStaff(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: staff ?? [],
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
        <div>
          <Heading>{t("bookings.staff.domain")}</Heading>
        </div>
        <Link to="/bookings/staff/create">
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
        filters={[
          {
            key: "is_active",
            label: t("bookings.staff.fields.isActive"),
            type: "select",
            options: [
              { label: t("general.active"), value: "true" },
              { label: t("general.disabled"), value: "false" },
            ],
          },
        ]}
        orderBy={[
          { key: "name", label: t("fields.name") },
          { key: "email", label: t("fields.email") },
          { key: "created_at", label: t("fields.createdAt") },
        ]}
        isLoading={isLoading}
        navigateTo={(row) => row.original.id}
        search
        queryObject={raw}
        noRecords={{
          message: t("bookings.staff.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}

const StaffActions = ({ staffMember }: { staffMember: AdminBookingStaff }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: deleteStaff } = useDeleteBookingStaff(staffMember.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("bookings.staff.delete.title"),
      description: t("bookings.staff.delete.description", {
        name: staffMember.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await deleteStaff(undefined, {
      onSuccess: () => {
        toast.success(
          t("bookings.staff.delete.successToast", {
            name: staffMember.name,
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
              to: `/bookings/staff/${staffMember.id}/edit`,
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

const columnHelper = createColumnHelper<AdminBookingStaff>()

const useColumns = () => {
  const columns = useStaffTableColumns()

  return useMemo(
    () => [
      ...columns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <StaffActions staffMember={row.original} />,
      }),
    ],
    [columns]
  )
}
