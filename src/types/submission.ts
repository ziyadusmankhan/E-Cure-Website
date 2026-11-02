export type SubmissionKind = "appointment" | "inquiry";
export type SubmissionMode = "disabled" | "local-test" | "live";
export type SubmissionConfig = {
  enabled: boolean;
  localTest: boolean;
  unavailable: boolean;
  siteKey: string;
  timezone: string;
  serviceSlugs: string[];
};
export type SubmissionReceipt = { reference: string; status: "new" };
export const disabledSubmissions: SubmissionConfig = {
  enabled: false,
  localTest: false,
  unavailable: false,
  siteKey: "",
  timezone: "Asia/Karachi",
  serviceSlugs: [],
};
