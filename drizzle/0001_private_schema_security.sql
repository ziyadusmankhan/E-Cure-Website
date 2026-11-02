-- Application tables are private, never exposed through the Supabase Data API.
DO $security$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'healthcare_app') THEN
    CREATE ROLE healthcare_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'healthcare_app' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolinherit)) THEN
    RAISE EXCEPTION 'Existing application role has unsafe privileges';
  END IF;
END
$security$;
--> statement-breakpoint
REVOKE ALL ON SCHEMA healthcare FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA healthcare FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA healthcare FROM PUBLIC;
--> statement-breakpoint
DO $security$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA healthcare FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA healthcare FROM %I', api_role);
    END IF;
  END LOOP;
END
$security$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA healthcare TO healthcare_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare.business_settings, healthcare.services, healthcare.pages, healthcare.customers TO healthcare_app;
GRANT SELECT, INSERT, UPDATE ON healthcare.appointments, healthcare.contact_inquiries TO healthcare_app;
GRANT SELECT ON healthcare.administrative_roles, healthcare.administrative_users TO healthcare_app;
GRANT SELECT, INSERT ON healthcare.audit_events TO healthcare_app;
--> statement-breakpoint
DO $security$
DECLARE item record;
BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname = 'healthcare' LOOP
    EXECUTE format('ALTER TABLE healthcare.%I ENABLE ROW LEVEL SECURITY', item.tablename);
    EXECUTE format('CREATE POLICY server_application ON healthcare.%I TO healthcare_app USING (true) WITH CHECK (true)', item.tablename);
  END LOOP;
END
$security$;
--> statement-breakpoint
-- New objects remain private until a later reviewed migration grants access.
ALTER DEFAULT PRIVILEGES IN SCHEMA healthcare REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA healthcare REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA healthcare REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
--> statement-breakpoint
CREATE FUNCTION healthcare.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $trigger$
BEGIN
  NEW.updated_at = transaction_timestamp();
  RETURN NEW;
END
$trigger$;
REVOKE ALL ON FUNCTION healthcare.touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION healthcare.touch_updated_at() TO healthcare_app;
--> statement-breakpoint
DO $triggers$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['business_settings', 'services', 'pages', 'customers', 'appointments', 'contact_inquiries'] LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON healthcare.%I FOR EACH ROW EXECUTE FUNCTION healthcare.touch_updated_at()', table_name);
  END LOOP;
END
$triggers$;
--> statement-breakpoint
INSERT INTO healthcare.administrative_roles (key, label) VALUES ('owner', 'Owner'), ('receptionist', 'Receptionist');
