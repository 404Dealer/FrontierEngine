import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SingleColumnPageSkeleton } from "../../../../components/common/skeleton"
import { TwoColumnPage } from "../../../../components/layout/pages"
import {
  AdminBookingServiceResponse,
  useBookingService,
  useDeleteBookingService,
} from "../../../../hooks/api/bookings"
import { serviceLoader } from "./loader"

/**
 * Extract numeric value from various price formats (BigNumber, string, number)
 */
const extractPriceValue = (price: unknown): number => {
  if (price === null || price === undefined) return 0
  // Handle BigNumber object format {value: "3500"}
  if (typeof price === "object" && price !== null && "value" in price) {
    return parseFloat(String((price as { value: unknown }).value))
  }
  return typeof price === "string" ? parseFloat(price) : Number(price)
}

export const ServiceDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  // DEBUG: Log price values to diagnose display bug
  console.log("ServiceDetail DEBUG - check service.price below")
  const navigate = useNavigate()
  const prompt = usePrompt()

  const initialData = useLoaderData() as Awaited<ReturnType<typeof serviceLoader>>
  const { service, isLoading, isError, error } = useBookingService(id!, undefined, {
    initialData: initialData as AdminBookingServiceResponse,
  })
  const { mutateAsync: deleteService } = useDeleteBookingService(id!)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("bookings.services.delete.confirmation"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (confirmed) {
      await deleteService(undefined, {
        onSuccess: () => {
          toast.success(t("bookings.services.delete.successToast"))
          navigate("/bookings/services")
        },
        onError: (err) => {
          toast.error(err.message)
        },
      })
    }
  }

  if (isLoading || !service) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  // DEBUG: Log the actual price value from API
  console.log("ServiceDetail price DEBUG:", {
    rawPrice: service.price,
    priceType: typeof service.price,
    extractedValue: extractPriceValue(service.price),
    afterDivide100: extractPriceValue(service.price) / 100,
  })

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
      data={service}
      hasOutlet
      showJSON
      showMetadata
    >
      <TwoColumnPage.Main>
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2">{service.name}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {service.description || t("bookings.services.noDescription")}
              </Text>
            </div>
            <div className="flex items-center gap-x-2">
              <Badge color={service.is_active ? "green" : "grey"}>
                {service.is_active
                  ? t("bookings.services.active")
                  : t("bookings.services.inactive")}
              </Badge>
              <ActionMenu
                groups={[
                  {
                    actions: [
                      {
                        icon: <PencilSquare />,
                        label: t("actions.edit"),
                        to: "edit",
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <div>
              <Text size="small" weight="plus">
                {t("bookings.services.fields.duration")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {service.duration_minutes} {t("bookings.services.minutes")}
              </Text>
            </div>
            <div>
              <Text size="small" weight="plus">
                {t("bookings.services.fields.buffer")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {service.buffer_minutes || 0} {t("bookings.services.minutes")}
              </Text>
            </div>
          </div>

          {/* DEBUG: Visible debug info - REMOVE AFTER FIXING */}
          <div className="bg-red-100 border border-red-400 px-6 py-2 text-red-700 text-xs">
            <strong>DEBUG:</strong> rawPrice={JSON.stringify(service.price)} |
            type={typeof service.price} |
            extracted={extractPriceValue(service.price)} |
            /100={extractPriceValue(service.price) / 100}
          </div>

          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <div>
              <Text size="small" weight="plus">
                {t("bookings.services.fields.price")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {service.price
                  ? `[v2] ${(extractPriceValue(service.price) / 100).toFixed(2)} ${service.currency_code?.toUpperCase()}`
                  : t("bookings.services.noPrice")}
              </Text>
            </div>
            <div>
              <Text size="small" weight="plus">
                {t("bookings.services.fields.depositType")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {service.deposit_type === "none"
                  ? t("bookings.services.depositTypes.none")
                  : service.deposit_type === "fixed"
                    ? `${t("bookings.services.depositTypes.fixed")}: ${(extractPriceValue(service.deposit_value) / 100).toFixed(2)}`
                    : `${t("bookings.services.depositTypes.percent")}: ${extractPriceValue(service.deposit_value)}%`}
              </Text>
            </div>
          </div>

          <div className="px-6 py-4">
            <Text size="small" weight="plus">
              {t("bookings.services.fields.paymentModes")}
            </Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {service.payment_modes_allowed?.map((mode) => (
                <Badge key={mode} color="grey">
                  {t(`bookings.paymentModes.${mode}`)}
                </Badge>
              ))}
            </div>
          </div>
        </Container>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>{/* Additional info */}</TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
