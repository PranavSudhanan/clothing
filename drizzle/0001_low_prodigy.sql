CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text NOT NULL,
	"event" text NOT NULL,
	"recipient" text NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"error" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");