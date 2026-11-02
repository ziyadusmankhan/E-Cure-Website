ALTER TABLE healthcare.submission_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare.submission_limits ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY server_application ON healthcare.submission_receipts TO healthcare_app USING (true) WITH CHECK (true);
CREATE POLICY server_application ON healthcare.submission_limits TO healthcare_app USING (true) WITH CHECK (true);
--> statement-breakpoint
REVOKE ALL ON healthcare.submission_receipts, healthcare.submission_limits FROM PUBLIC;
DO $security$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON healthcare.submission_receipts, healthcare.submission_limits FROM %I', api_role);
    END IF;
  END LOOP;
END
$security$;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON healthcare.submission_receipts TO healthcare_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare.submission_limits TO healthcare_app;
