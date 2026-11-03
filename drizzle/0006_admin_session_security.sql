ALTER TABLE healthcare.administrative_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY server_application ON healthcare.administrative_sessions TO healthcare_app USING (true) WITH CHECK (true);
REVOKE ALL ON healthcare.administrative_sessions FROM PUBLIC;
DO $security$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON healthcare.administrative_sessions FROM %I', api_role);
    END IF;
  END LOOP;
  -- A co-located Supabase deployment can enforce the actual Auth identity FK.
  -- Native PostgreSQL with separate Supabase Auth has no cross-database FK.
  IF to_regclass('auth.users') IS NOT NULL THEN
    ALTER TABLE healthcare.administrative_users ADD CONSTRAINT admin_supabase_identity_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$security$;
GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare.administrative_sessions TO healthcare_app;
