ALTER TABLE healthcare.cms_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare.workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY server_application ON healthcare.cms_state TO healthcare_app USING (true) WITH CHECK (true);
CREATE POLICY server_application ON healthcare.media_assets TO healthcare_app USING (true) WITH CHECK (true);
CREATE POLICY server_application ON healthcare.workflow_events TO healthcare_app USING (true) WITH CHECK (true);
REVOKE ALL ON healthcare.cms_state,healthcare.media_assets,healthcare.workflow_events FROM PUBLIC;
DO $security$
DECLARE api_role text;
BEGIN
 FOREACH api_role IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=api_role) THEN
   EXECUTE format('REVOKE ALL ON healthcare.cms_state,healthcare.media_assets,healthcare.workflow_events FROM %I',api_role);
  END IF;
 END LOOP;
END
$security$;
GRANT SELECT,INSERT,UPDATE ON healthcare.cms_state TO healthcare_app;
GRANT SELECT,INSERT ON healthcare.media_assets,healthcare.workflow_events TO healthcare_app;
GRANT UPDATE(published_at) ON healthcare.media_assets TO healthcare_app;
--> statement-breakpoint
CREATE INDEX appointments_assignee_created_idx ON healthcare.appointments(assigned_to,created_at);
CREATE INDEX inquiries_assignee_created_idx ON healthcare.contact_inquiries(assigned_to,created_at);
ALTER TABLE healthcare.appointments ADD CONSTRAINT appointment_version_positive CHECK(version>=0);
ALTER TABLE healthcare.contact_inquiries ADD CONSTRAINT inquiry_version_positive CHECK(version>=0);
ALTER TABLE healthcare.customers ADD CONSTRAINT customer_version_positive CHECK(version>=0);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON healthcare.cms_state FOR EACH ROW EXECUTE FUNCTION healthcare.touch_updated_at();
--> statement-breakpoint
-- Existing operational records receive one structural starting point. No notes
-- or contact details are copied into the general audit log.
INSERT INTO healthcare.workflow_events(appointment_id,to_status,created_at)
 SELECT id,status,created_at FROM healthcare.appointments;
INSERT INTO healthcare.workflow_events(inquiry_id,to_status,created_at)
 SELECT id,status,created_at FROM healthcare.contact_inquiries;
