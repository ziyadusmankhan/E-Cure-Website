CREATE TABLE "healthcare"."cms_state" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"draft" jsonb NOT NULL,
	"published" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"published_revision" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_singleton" CHECK ("healthcare"."cms_state"."id"=1),
	CONSTRAINT "cms_revision_valid" CHECK ("healthcare"."cms_state"."revision">=0 and "healthcare"."cms_state"."published_revision">=0 and "healthcare"."cms_state"."published_revision"<="healthcare"."cms_state"."revision")
);
--> statement-breakpoint
CREATE TABLE "healthcare"."media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" text NOT NULL,
	"digest" varchar(64) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_dimensions" CHECK ("healthcare"."media_assets"."width" between 1 and 1600 and "healthcare"."media_assets"."height" between 1 and 1600),
	CONSTRAINT "media_bounded" CHECK (length("healthcare"."media_assets"."data") between 1 and 2000000)
);
--> statement-breakpoint
CREATE TABLE "healthcare"."workflow_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid,
	"inquiry_id" uuid,
	"actor_id" uuid,
	"kind" varchar(20) DEFAULT 'status' NOT NULL,
	"from_status" varchar(20),
	"to_status" varchar(20) NOT NULL,
	"note" varchar(1000) DEFAULT '' NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_record" CHECK (("healthcare"."workflow_events"."appointment_id" is not null)::int+("healthcare"."workflow_events"."inquiry_id" is not null)::int=1),
	CONSTRAINT "workflow_kind" CHECK ("healthcare"."workflow_events"."kind" in ('status','note','assignment'))
);
--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_action_valid";--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_entity_valid";--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_metadata_redacted";--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "healthcare"."customers" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcare"."workflow_events" ADD CONSTRAINT "workflow_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "healthcare"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."workflow_events" ADD CONSTRAINT "workflow_events_inquiry_id_contact_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "healthcare"."contact_inquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."workflow_events" ADD CONSTRAINT "workflow_events_actor_id_administrative_users_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."workflow_events" ADD CONSTRAINT "workflow_events_assigned_to_administrative_users_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_appointment_created_idx" ON "healthcare"."workflow_events" USING btree ("appointment_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_inquiry_created_idx" ON "healthcare"."workflow_events" USING btree ("inquiry_id","created_at");--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD CONSTRAINT "appointments_assigned_to_administrative_users_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."contact_inquiries" ADD CONSTRAINT "contact_inquiries_assigned_to_administrative_users_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_action_valid" CHECK ("healthcare"."audit_events"."action" in ('created', 'updated', 'deleted', 'requested', 'seeded', 'signed_in', 'signed_out', 'mfa_verified', 'published'));--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_entity_valid" CHECK ("healthcare"."audit_events"."entity_type" in ('business', 'service', 'page', 'customer', 'appointment', 'inquiry', 'administration', 'publication', 'media'));--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_metadata_redacted" CHECK ("healthcare"."audit_events"."metadata" in ('{"source":"foundation"}'::jsonb, '{"source":"fixture"}'::jsonb, '{"source":"authentication"}'::jsonb, '{"source":"administration"}'::jsonb));