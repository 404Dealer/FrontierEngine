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
  AdminBookingService,
  useBookingServices,
  useDeleteBookingService,
} from "../../../../../../hooks/api/bookings"
import { useServiceTableColumns } from "../../../../../../hooks/table/columns/use-service-table-columns"
import { useServiceTableQuery } from "../../../../../../hooks/table/query/use-service-table-query"
import { useDataTable } from "../../../../../../hooks/use-data-table"

const PAGE_SIZE = 50

export const ServiceListTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useServiceTableQuery({ pageSize: PAGE_SIZE })
  const { services, count, isLoading, isError, error } = useBookingServices(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: services ?? [],
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
          <Heading>{t("bookings.services.domain")}</Heading>
        </div>
        <Link to="/bookings/services/create">
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
            label: t("bookings.services.fields.isActive"),
            type: "select",
            options: [
              { label: t("general.active"), value: "true" },
              { label: t("general.disabled"), value: "false" },
            ],
          },
        ]}
        orderBy={[
          { key: "name", label: t("fields.name") },
          { key: "duration_minutes", label: t("bookings.services.fields.durationMinutes") },
          { key: "price", label: t("bookings.services.fields.price") },
          { key: "created_at", label: t("fields.createdAt") },
        ]}
        isLoading={isLoading}
        navigateTo={(row) => row.original.id}
        search
        queryObject={raw}
        noRecords={{
          message: t("bookings.services.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}

const ServiceActions = ({ service }: { service: AdminBookingService }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: deleteService } = useDeleteBookingService(service.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("bookings.services.delete.title"),
      description: t("bookings.services.delete.description", {
        name: service.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await deleteService(undefined, {
      onSuccess: () => {
        toast.success(
          t("bookings.services.delete.successToast", {
            name: service.name,
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
              to: `/bookings/services/${service.id}/edit`,
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

const columnHelper = createColumnHelper<AdminBookingService>()

const useColumns = () => {
  const columns = useServiceTableColumns()

  return useMemo(
    () => [
      ...columns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ServiceActions service={row.original} />,
      }),
    ],
    [columns]
  )
}
