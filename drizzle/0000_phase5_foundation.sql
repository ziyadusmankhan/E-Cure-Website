CREATE SCHEMA "healthcare";
--> statement-breakpoint
CREATE TYPE "healthcare"."appointment_status" AS ENUM('new', 'contacted', 'confirmed', 'completed', 'cancelled', 'declined');--> statement-breakpoint
CREATE TYPE "healthcare"."inquiry_status" AS ENUM('new', 'read', 'archived');--> statement-breakpoint
CREATE TABLE "healthcare"."administrative_roles" (
	"key" varchar(20) PRIMARY KEY NOT NULL,
	"label" varchar(80) NOT NULL,
	CONSTRAINT "admin_role_valid" CHECK ("healthcare"."administrative_roles"."key" in ('owner', 'receptionist'))
);
--> statement-breakpoint
CREATE TABLE "healthcare"."administrative_users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role_key" varchar(20) NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "healthcare"."appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(40) NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"visit_mode" varchar(20) NOT NULL,
	"preferred_date" date NOT NULL,
	"time_window" varchar(80) NOT NULL,
	"status" "healthcare"."appointment_status" DEFAULT 'new' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "appointment_mode_valid" CHECK ("healthcare"."appointments"."visit_mode" in ('home', 'clinic', 'online')),
	CONSTRAINT "appointment_time_nonempty" CHECK (length(trim("healthcare"."appointments"."time_window")) > 0),
	CONSTRAINT "appointment_reference_valid" CHECK ("healthcare"."appointments"."reference" ~ '^REQ-[A-F0-9]{24}$'),
	CONSTRAINT "appointment_date_range" CHECK ("healthcare"."appointments"."preferred_date" between '2000-01-01'::date and '2100-12-31'::date),
	CONSTRAINT "appointment_confirmed_time" CHECK ("healthcare"."appointments"."status" not in ('confirmed', 'completed') or "healthcare"."appointments"."confirmed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "healthcare"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(40) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" varchar(80) NOT NULL,
	"metadata" jsonb DEFAULT '{"source":"foundation"}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_action_valid" CHECK ("healthcare"."audit_events"."action" in ('created', 'updated', 'deleted', 'requested', 'seeded')),
	CONSTRAINT "audit_entity_valid" CHECK ("healthcare"."audit_events"."entity_type" in ('business', 'service', 'page', 'customer', 'appointment', 'inquiry')),
	CONSTRAINT "audit_metadata_redacted" CHECK ("healthcare"."audit_events"."metadata" in ('{"source":"foundation"}'::jsonb, '{"source":"fixture"}'::jsonb))
);
--> statement-breakpoint
CREATE TABLE "healthcare"."business_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"profile_id" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"business_type" varchar(40) NOT NULL,
	"timezone" varchar(80) DEFAULT 'Asia/Karachi' NOT NULL,
	"theme" varchar(40) NOT NULL,
	"contact_email" varchar(254),
	"phone" varchar(24),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_singleton" CHECK ("healthcare"."business_settings"."id" = 1),
	CONSTRAINT "business_name_nonempty" CHECK (length(trim("healthcare"."business_settings"."name")) > 0),
	CONSTRAINT "business_theme_valid" CHECK ("healthcare"."business_settings"."theme" in ('clinical-blue', 'soft-teal', 'warm-neutral'))
);
--> statement-breakpoint
CREATE TABLE "healthcare"."contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"status" "healthcare"."inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiry_name_nonempty" CHECK (length(trim("healthcare"."contact_inquiries"."name")) > 0),
	CONSTRAINT "inquiry_email_valid" CHECK ("healthcare"."contact_inquiries"."email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
	CONSTRAINT "inquiry_subject_nonempty" CHECK (length(trim("healthcare"."contact_inquiries"."subject")) > 0),
	CONSTRAINT "inquiry_message_length" CHECK (length(trim("healthcare"."contact_inquiries"."message")) between 10 and 2000)
);
--> statement-breakpoint
CREATE TABLE "healthcare"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(24) NOT NULL,
	"email" varchar(254),
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_name_nonempty" CHECK (length(trim("healthcare"."customers"."name")) > 0),
	CONSTRAINT "customer_phone_valid" CHECK ("healthcare"."customers"."phone" ~ '^[+]?[0-9]{7,15}$'),
	CONSTRAINT "customer_email_valid" CHECK ("healthcare"."customers"."email" is null or "healthcare"."customers"."email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
);
--> statement-breakpoint
CREATE TABLE "healthcare"."pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "page_slug_valid" CHECK ("healthcare"."pages"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "page_title_nonempty" CHECK (length(trim("healthcare"."pages"."title")) > 0),
	CONSTRAINT "page_content_array" CHECK (jsonb_typeof("healthcare"."pages"."content") = 'array')
);
--> statement-breakpoint
CREATE TABLE "healthcare"."services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug"),
	CONSTRAINT "service_slug_valid" CHECK ("healthcare"."services"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "service_title_nonempty" CHECK (length(trim("healthcare"."services"."title")) > 0),
	CONSTRAINT "service_order_nonnegative" CHECK ("healthcare"."services"."display_order" >= 0),
	CONSTRAINT "service_content_array" CHECK (jsonb_typeof("healthcare"."services"."content") = 'array')
);
--> statement-breakpoint
ALTER TABLE "healthcare"."administrative_users" ADD CONSTRAINT "administrative_users_role_key_administrative_roles_key_fk" FOREIGN KEY ("role_key") REFERENCES "healthcare"."administrative_roles"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "healthcare"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "healthcare"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_events_actor_id_administrative_users_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_status_created_idx" ON "healthcare"."appointments" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "appointments_preferred_date_idx" ON "healthcare"."appointments" USING btree ("preferred_date");--> statement-breakpoint
CREATE INDEX "appointments_customer_idx" ON "healthcare"."appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "appointments_service_idx" ON "healthcare"."appointments" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "healthcare"."audit_events" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "healthcare"."audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "inquiries_status_created_idx" ON "healthcare"."contact_inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "healthcare"."customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "healthcare"."customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "services_public_order_idx" ON "healthcare"."services" USING btree ("enabled","published","display_order");