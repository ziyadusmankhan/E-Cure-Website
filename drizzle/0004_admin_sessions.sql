CREATE TABLE "healthcare"."administrative_sessions" (
	"key_hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_session_hash_valid" CHECK ("healthcare"."administrative_sessions"."key_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "admin_session_lifetime_valid" CHECK ("healthcare"."administrative_sessions"."expires_at" > "healthcare"."administrative_sessions"."created_at" and "healthcare"."administrative_sessions"."expires_at" <= "healthcare"."administrative_sessions"."created_at" + interval '8 hours')
);
--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_action_valid";--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_entity_valid";--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" DROP CONSTRAINT "audit_metadata_redacted";--> statement-breakpoint
ALTER TABLE "healthcare"."administrative_sessions" ADD CONSTRAINT "administrative_sessions_user_id_administrative_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "healthcare"."administrative_users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "healthcare"."administrative_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "healthcare"."administrative_sessions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_action_valid" CHECK ("healthcare"."audit_events"."action" in ('created', 'updated', 'deleted', 'requested', 'seeded', 'signed_in', 'signed_out', 'mfa_verified'));--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_entity_valid" CHECK ("healthcare"."audit_events"."entity_type" in ('business', 'service', 'page', 'customer', 'appointment', 'inquiry', 'administration'));--> statement-breakpoint
ALTER TABLE "healthcare"."audit_events" ADD CONSTRAINT "audit_metadata_redacted" CHECK ("healthcare"."audit_events"."metadata" in ('{"source":"foundation"}'::jsonb, '{"source":"fixture"}'::jsonb, '{"source":"authentication"}'::jsonb));