import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260109000000 extends Migration {
  override async up(): Promise<void> {
    // Replace region_id with sales_channel_id on booking_service table
    this.addSql(`ALTER TABLE "booking_service" RENAME COLUMN "region_id" TO "sales_channel_id";`)
  }

  override async down(): Promise<void> {
    // Revert: rename sales_channel_id back to region_id
    this.addSql(`ALTER TABLE "booking_service" RENAME COLUMN "sales_channel_id" TO "region_id";`)
  }
}
