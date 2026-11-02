CREATE TABLE "healthcare"."submission_limits" (
	"key_hash" varchar(64) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"resets_at" timestamp with time zone NOT NULL,
	CONSTRAINT "limit_attempts_positive" CHECK ("healthcare"."submission_limits"."attempts" > 0),
	CONSTRAINT "limit_hash_valid" CHECK ("healthcare"."submission_limits"."key_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "healthcare"."submission_receipts" (
	"key_hash" varchar(64) PRIMARY KEY NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"reference" varchar(40) NOT NULL,
	"appointment_id" uuid,
	"inquiry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL,
	CONSTRAINT "receipt_kind_valid" CHECK (("healthcare"."submission_receipts"."kind" = 'appointment' and "healthcare"."submission_receipts"."appointment_id" is not null and "healthcare"."submission_receipts"."inquiry_id" is null) or ("healthcare"."submission_receipts"."kind" = 'inquiry' and "healthcare"."submission_receipts"."inquiry_id" is not null and "healthcare"."submission_receipts"."appointment_id" is null)),
	CONSTRAINT "receipt_hash_valid" CHECK ("healthcare"."submission_receipts"."key_hash" ~ '^[a-f0-9]{64}$' and "healthcare"."submission_receipts"."fingerprint" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD COLUMN "inquiry" varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD COLUMN "reference" varchar(40) DEFAULT 'INQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24)) NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD COLUMN "consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "healthcare"."submission_receipts" ADD CONSTRAINT "submission_receipts_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "healthcare"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."submission_receipts" ADD CONSTRAINT "submission_receipts_inquiry_id_contact_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "healthcare"."contact_inquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "limit_expiry_idx" ON "healthcare"."submission_limits" USING btree ("resets_at");--> statement-breakpoint
CREATE INDEX "receipt_expiry_idx" ON "healthcare"."submission_receipts" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD CONSTRAINT "contact_inquiries_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD CONSTRAINT "inquiry_reference_valid" CHECK ("healthcare"."contact_inquiries"."reference" ~ '^INQ-[A-F0-9]{24}$');