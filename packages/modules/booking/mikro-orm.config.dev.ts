import * as entities from "./src/models"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

// Filter out enums and only include DmlEntity models
const modelEntities = Object.values(entities).filter(
  (entity) => entity?.constructor?.name === "DmlEntity"
)

export default defineMikroOrmCliConfig(Modules.BOOKING, {
  entities: modelEntities,
  dbName: process.env.POSTGRES_DB || "medusa",
  host: process.env.POSTGRES_HOST || "localhost",
  user: process.env.POSTGRES_USER || "medusa",
  password: process.env.POSTGRES_PASSWORD || "CHANGE_ME_USE_STRONG_PASSWORD",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
})
