import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260105000000 extends Migration {
  override async up(): Promise<void> {
    // Create booking_service table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "booking_service" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NULL,
        "duration_minutes" INTEGER NOT NULL DEFAULT 30,
        "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
        "price" NUMERIC NOT NULL,
        "currency_code" TEXT NOT NULL DEFAULT 'usd',
        "region_id" TEXT NULL,
        "deposit_type" TEXT NOT NULL DEFAULT 'none',
        "deposit_value" NUMERIC NULL,
        "payment_modes_allowed" JSONB NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB NULL,
        "raw_price" JSONB NOT NULL,
        "raw_deposit_value" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "booking_service_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_service_deleted_at" ON "booking_service" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_service_is_active" ON "booking_service" ("is_active") WHERE deleted_at IS NULL;`)

    // Create booking_settings table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "booking_settings" (
        "id" TEXT NOT NULL,
        "allow_guest_bookings" BOOLEAN NOT NULL DEFAULT true,
        "default_hold_duration_minutes" INTEGER NOT NULL DEFAULT 10,
        "cancellation_window_hours" INTEGER NOT NULL DEFAULT 2,
        "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_settings_deleted_at" ON "booking_settings" ("deleted_at") WHERE deleted_at IS NULL;`)

    // Create booking_staff table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "booking_staff" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NULL,
        "phone" TEXT NULL,
        "bio" TEXT NULL,
        "avatar_url" TEXT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "booking_staff_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_staff_deleted_at" ON "booking_staff" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_staff_is_active" ON "booking_staff" ("is_active") WHERE deleted_at IS NULL;`)

    // Create booking_availability_rule table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "booking_availability_rule" (
        "id" TEXT NOT NULL,
        "staff_id" TEXT NOT NULL,
        "rule_type" TEXT NOT NULL DEFAULT 'recurring',
        "day_of_week" INTEGER NULL,
        "specific_date" TIMESTAMPTZ NULL,
        "start_time" TEXT NOT NULL,
        "end_time" TEXT NOT NULL,
        "is_available" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "booking_availability_rule_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "booking_availability_rule_staff_id_foreign" FOREIGN KEY ("staff_id") REFERENCES "booking_staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_availability_rule_staff_id" ON "booking_availability_rule" ("staff_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_availability_rule_deleted_at" ON "booking_availability_rule" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_availability_staff_day" ON "booking_availability_rule" ("staff_id", "day_of_week") WHERE deleted_at IS NULL AND rule_type = 'recurring';`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_availability_staff_date" ON "booking_availability_rule" ("staff_id", "specific_date") WHERE deleted_at IS NULL AND specific_date IS NOT NULL;`)

    // Create booking table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "booking" (
        "id" TEXT NOT NULL,
        "display_id" SERIAL,
        "staff_id" TEXT NOT NULL,
        "service_id" TEXT NOT NULL,
        "customer_id" TEXT NULL,
        "start_at" TIMESTAMPTZ NOT NULL,
        "end_at" TIMESTAMPTZ NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'held',
        "hold_expires_at" TIMESTAMPTZ NULL,
        "service_name" TEXT NOT NULL,
        "price_amount" NUMERIC NOT NULL,
        "currency_code" TEXT NOT NULL,
        "deposit_amount" NUMERIC NULL,
        "payment_mode" TEXT NULL,
        "amount_paid" NUMERIC NULL,
        "customer_email" TEXT NULL,
        "customer_phone" TEXT NULL,
        "customer_name" TEXT NULL,
        "notes" TEXT NULL,
        "internal_notes" TEXT NULL,
        "confirmed_at" TIMESTAMPTZ NULL,
        "cancelled_at" TIMESTAMPTZ NULL,
        "completed_at" TIMESTAMPTZ NULL,
        "metadata" JSONB NULL,
        "raw_price_amount" JSONB NOT NULL,
        "raw_deposit_amount" JSONB NULL,
        "raw_amount_paid" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "booking_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "booking_staff_id_foreign" FOREIGN KEY ("staff_id") REFERENCES "booking_staff" ("id") ON UPDATE CASCADE
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_staff_id" ON "booking" ("staff_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_deleted_at" ON "booking" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_booking_staff_start" ON "booking" ("staff_id", "start_at") WHERE deleted_at IS NULL AND status IN ('held', 'confirmed');`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_status" ON "booking" ("status") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_customer" ON "booking" ("customer_id") WHERE deleted_at IS NULL AND customer_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_hold_expires" ON "booking" ("hold_expires_at") WHERE deleted_at IS NULL AND status = 'held';`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_date_range" ON "booking" ("start_at", "end_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "booking" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "booking_availability_rule" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "booking_staff" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "booking_settings" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "booking_service" CASCADE;`)
  }
}
