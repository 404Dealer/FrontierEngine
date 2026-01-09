import { createCartWorkflow } from "@medusajs/core-flows"
import {
  AdditionalData,
  CreateCartWorkflowInputDTO,
  HttpTypes,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { refetchCart } from "./helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.StoreCreateCart & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  let salesChannelId = req.validatedBody.sales_channel_id

  // Fallback: Get default sales channel if not provided via publishable key or request body
  if (!salesChannelId) {
    const query = req.scope.resolve("query")
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
      filters: { is_disabled: false },
    })
    if (salesChannels?.length > 0) {
      salesChannelId = salesChannels[0].id
    }
  }

  const workflowInput = {
    ...req.validatedBody,
    sales_channel_id: salesChannelId,
    customer_id: req.auth_context?.actor_id,
  }

  const { result } = await createCartWorkflow(req.scope).run({
    input: workflowInput as CreateCartWorkflowInputDTO,
  })

  const cart = await refetchCart(result.id, req.scope, req.queryConfig.fields)

  res.status(200).json({ cart })
}
