"use client";
import { site } from "@/config/site";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Pencil, Info } from "lucide-react";
import { services } from "@/data/services";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/components/shared/service-icon";
import { createBookingSchema, localToday, type BookingValues } from "@/lib/validations";
import {
  disabledSubmissions,
  type SubmissionConfig,
  type SubmissionReceipt,
} from "@/types/submission";
import { visitModes } from "@/lib/submission-values";
import { useSubmission } from "./use-submission";
import { SubmissionSecurity } from "./submission-security";

export function BookingForm({
  submissions = disabledSubmissions,
}: {
  submissions?: SubmissionConfig;
}) {
  const availableServices = submissions.enabled
    ? services.filter((service) => submissions.serviceSlugs.includes(service.slug))
    : services;
  const submission = useSubmission("appointment");
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [visitMode, setVisitMode] = useState<(typeof visitModes)[number] | "">("");
  const [modeError, setModeError] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [token, setToken] = useState("");
  const [website, setWebsite] = useState("");
  const params = useSearchParams();
  const initialService = availableServices.some((s) => s.slug === params.get("service"))
    ? params.get("service")!
    : "";
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm<BookingValues>({
    resolver: zodResolver(
      createBookingSchema(
        availableServices,
        submissions.enabled ? submissions.timezone : undefined,
      ),
    ),
    defaultValues: {
      service: initialService,
      name: "",
      phone: "",
      email: "",
      date: "",
      inquiry: "",
    },
  });
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, complete]);
  const advance = async () => {
    if (await trigger("service", { shouldFocus: true })) setStep(1);
  };
  const review = () => {
    if (submissions.enabled && !visitMode) {
      setModeError("Please choose a preferred format.");
      return;
    }
    setModeError("");
    setStep(2);
  };
  const finish = async (data: BookingValues) => {
    if (submissions.enabled) {
      if (!consent) {
        setConsentError("Please agree before sending your request.");
        return;
      }
      if (!token || submissions.unavailable || !visitMode) return;
      setConsentError("");
      const saved = await submission.send({
        ...data,
        visitMode,
        consent,
        website,
        turnstileToken: token,
      });
      if (!saved) return;
      setReceipt(saved);
    }
    reset();
    setComplete(true);
  };
  const values = getValues();
  const errorProps = (key: keyof BookingValues) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const error = (key: keyof BookingValues) =>
    errors[key] && (
      <span className="field-error" id={`${key}-error`} role="alert">
        {errors[key]?.message}
      </span>
    );
  if (complete)
    return (
      <div className="completion">
        <CheckCircle2 size={45} strokeWidth={1.4} aria-hidden="true" />
        <span className="eyebrow">
          {receipt ? "REQUEST RECEIVED" : site.copy.forms_booking_form_demo_complete_1}
        </span>
        <h2 ref={headingRef} tabIndex={-1}>
          {receipt
            ? site.copy.submission_received
            : site.copy.forms_booking_form_youve_explored_the_request_experience_2}
        </h2>
        <p className="completion-notice" role="status">
          {receipt
            ? submissions.localTest
              ? site.copy.submission_receipt_local
              : site.copy.submission_receipt_live
            : site.copy.forms_booking_form_this_is_a_demonstration_your_3}
        </p>
        {receipt ? (
          <p className="submission-reference">
            Request reference <strong>{receipt.reference}</strong>
          </p>
        ) : (
          <p>{site.copy.forms_booking_form_in_a_live_service_the_4}</p>
        )}
        <div className="hero-actions">
          <Button
            onClick={() => {
              reset({
                service: initialService,
                name: "",
                phone: "",
                email: "",
                date: "",
                inquiry: "",
              });
              setStep(0);
              setComplete(false);
              setReceipt(null);
              setConsent(false);
              setToken("");
              setWebsite("");
              setVisitMode("");
              submission.reset();
            }}
          >
            {site.copy.forms_booking_form_try_another_request_5}
          </Button>
          <Link href="/services" className="text-link">
            {site.copy.forms_booking_form_explore_services_6}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  return (
    <div className="booking-form">
      {submissions.enabled && (
        <p className="submission-notice">
          {submissions.unavailable
            ? site.copy.submission_unavailable
            : submissions.localTest
              ? site.copy.submission_local_notice
              : site.copy.submission_live_notice}
        </p>
      )}
      <ol className="form-progress" aria-label="Request progress">
        {["Choose service", "Your details", "Review request"].map((label, i) => (
          <li
            key={label}
            className={step >= i ? "current" : ""}
            aria-current={step === i ? "step" : undefined}
          >
            <span>{step > i ? <Check size={14} /> : i + 1}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
      <form
        noValidate
        onSubmit={
          step === 0
            ? (event) => {
                event.preventDefault();
                void advance();
              }
            : handleSubmit(step === 2 ? finish : review)
        }
      >
        <div hidden={step !== 0}>
          <h2 ref={step === 0 ? headingRef : undefined} tabIndex={-1}>
            {site.copy.forms_booking_form_what_kind_of_support_are_7}
          </h2>
          <p className="form-subtitle">
            {site.copy.forms_booking_form_choose_one_service_to_begin_8}
          </p>
          <fieldset
            className="service-options"
            aria-describedby={errors.service ? "service-error" : undefined}
          >
            <legend className="sr-only">{site.copy.forms_booking_form_choose_a_service_9}</legend>
            {availableServices.map((service) => (
              <label className="service-option" key={service.slug}>
                <input
                  type="radio"
                  value={service.slug}
                  {...register("service")}
                  {...errorProps("service")}
                />
                <ServiceIcon slug={service.slug} size={25} />
                <span>{service.title}</span>
                <span className="radio-indicator" />
              </label>
            ))}
          </fieldset>
          {error("service")}
          <div className="form-actions">
            <span className="small muted">{site.copy.forms_booking_form_step_1_of_3_10}</span>
            <Button type="button" onClick={advance}>
              {site.copy.forms_booking_form_continue_11}
              <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        <div hidden={step !== 1}>
          <h2 ref={step === 1 ? headingRef : undefined} tabIndex={-1}>
            {site.copy.forms_booking_form_a_few_details_to_shape_12}
          </h2>
          <p className="form-subtitle">
            {submissions.enabled
              ? submissions.localTest
                ? "Use fictional details. This request will be saved locally."
                : "Enter the contact details for this request."
              : site.copy.forms_booking_form_use_example_details_for_this_13}
          </p>
          <div className="fields-grid">
            <div className="field">
              <label htmlFor="booking-name">
                {site.copy.forms_booking_form_patient_or_contact_name_14}
              </label>
              <input
                id="booking-name"
                placeholder={site.copy.forms_booking_form_eg_alex_taylor_15}
                autoComplete="off"
                maxLength={80}
                {...register("name")}
                {...errorProps("name")}
              />
              {error("name")}
            </div>
            <div className="field">
              <label htmlFor="booking-phone">
                {site.copy.forms_booking_form_contact_number_16}
              </label>
              <input
                id="booking-phone"
                type="tel"
                placeholder={site.copy.forms_booking_form_enter_an_example_phone_number_17}
                autoComplete="off"
                maxLength={25}
                {...register("phone")}
                {...errorProps("phone")}
              />
              {error("phone")}
            </div>
            <div className="field field-full">
              <label htmlFor="booking-email">
                {site.copy.forms_booking_form_email_18}
                <span>{site.copy.forms_booking_form_optional_19}</span>
              </label>
              <input
                id="booking-email"
                type="email"
                placeholder={site.copy.forms_booking_form_eg_alexexamplecom_20}
                autoComplete="off"
                {...register("email")}
                {...errorProps("email")}
              />
              {error("email")}
            </div>
            <div className="field">
              <label htmlFor="booking-date">{site.copy.forms_booking_form_preferred_date_21}</label>
              <input
                id="booking-date"
                type="date"
                min={localToday(submissions.enabled ? submissions.timezone : undefined)}
                {...register("date")}
                {...errorProps("date")}
              />
              {error("date")}
            </div>
            <div className="field">
              <label htmlFor="booking-time">
                {site.copy.forms_booking_form_preferred_time_window_22}
              </label>
              <select id="booking-time" {...register("time")} {...errorProps("time")}>
                <option value="">{site.copy.forms_booking_form_select_a_time_window_23}</option>
                {[
                  "Morning (9am–12pm)",
                  "Afternoon (12pm–4pm)",
                  "Evening (4pm–7pm)",
                  "No preference",
                ].map((time) => (
                  <option key={time}>{time}</option>
                ))}
              </select>
              {error("time")}
            </div>
            <div className="field field-full">
              <label htmlFor="booking-inquiry">
                {site.copy.forms_booking_form_general_inquiry_24}
                <span>{site.copy.forms_booking_form_optional_25}</span>
              </label>
              <textarea
                id="booking-inquiry"
                rows={3}
                maxLength={500}
                placeholder={site.copy.forms_booking_form_a_general_question_about_arrangements_26}
                {...register("inquiry")}
                {...errorProps("inquiry")}
                aria-describedby={`inquiry-hint${errors.inquiry ? " inquiry-error" : ""}`}
              />
              <span id="inquiry-hint" className="field-hint">
                {site.copy.forms_booking_form_please_dont_include_medical_history_27}
              </span>
              {error("inquiry")}
            </div>
          </div>
          {submissions.enabled && (
            <div className="field submission-format">
              <label htmlFor="booking-format">Preferred format</label>
              <select
                id="booking-format"
                value={visitMode}
                onChange={(event) => {
                  setVisitMode(event.target.value as typeof visitMode);
                  setModeError("");
                }}
                aria-invalid={!!modeError}
                aria-describedby={modeError ? "booking-format-error" : undefined}
              >
                <option value="">Choose a format</option>
                <option value="home">At home</option>
                <option value="clinic">At the clinic</option>
                <option value="online">Online</option>
              </select>
              {modeError && (
                <span className="field-error" id="booking-format-error" role="alert">
                  {modeError}
                </span>
              )}
              <p className="field-hint">
                Date and time preferences use {submissions.timezone}. Availability and suitability
                must be confirmed separately.
              </p>
            </div>
          )}
          <div className="form-note">
            <Info size={17} />
            <p>{site.copy.forms_booking_form_dates_and_time_windows_are_28}</p>
          </div>
          <div className="form-actions">
            <Button type="button" variant="text" onClick={() => setStep(0)}>
              <ArrowLeft size={16} />
              {site.copy.forms_booking_form_back_29}
            </Button>
            <Button type="submit">
              {site.copy.forms_booking_form_review_request_30}
              <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        {step === 2 && (
          <div>
            <h2 ref={headingRef} tabIndex={-1}>
              {site.copy.forms_booking_form_does_everything_look_right_31}
            </h2>
            <p className="form-subtitle">
              {submissions.enabled
                ? "Review your request before sending it. This does not confirm an appointment."
                : site.copy.forms_booking_form_review_your_example_request_before_32}
            </p>
            <div className="review-section">
              <div className="review-heading">
                <h3>{site.copy.forms_booking_form_your_chosen_service_33}</h3>
                <button type="button" onClick={() => setStep(0)}>
                  <Pencil size={14} />
                  {site.copy.forms_booking_form_change_34}
                </button>
              </div>
              <p className="selected-service">
                <ServiceIcon slug={values.service} size={23} />
                {availableServices.find((s) => s.slug === values.service)?.title}
              </p>
            </div>
            <div className="review-section">
              <div className="review-heading">
                <h3>{site.copy.forms_booking_form_request_details_35}</h3>
                <button type="button" onClick={() => setStep(1)}>
                  <Pencil size={14} />
                  {site.copy.forms_booking_form_edit_details_36}
                </button>
              </div>
              <dl className="review-details">
                {[
                  ["Name", values.name],
                  ["Contact number", values.phone],
                  ["Email", values.email || "Not provided"],
                  ["Preferred date", values.date],
                  ["Preferred time", values.time],
                  ["General inquiry", values.inquiry || "Not provided"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="form-note">
              <Info size={18} />
              <p>
                {submissions.enabled
                  ? submissions.localTest
                    ? site.copy.submission_local_notice
                    : site.copy.submission_live_notice
                  : site.copy.forms_booking_form_this_is_a_demonstration_finishing_37}
              </p>
            </div>
            {submissions.enabled && (
              <SubmissionSecurity
                config={submissions}
                kind="appointment"
                consent={consent}
                setConsent={(value) => {
                  setConsent(value);
                  setConsentError("");
                }}
                tokenChanged={setToken}
                resetKey={submission.resetKey}
                error={consentError}
                website={website}
                setWebsite={setWebsite}
              />
            )}
            {submission.error && (
              <p className="submission-error field-error" role="alert">
                {submission.error}
              </p>
            )}
            <div className="form-actions">
              <Button type="button" variant="text" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
                {site.copy.forms_booking_form_back_38}
              </Button>
              <Button
                type="submit"
                disabled={
                  submission.pending || (submissions.enabled && (!token || submissions.unavailable))
                }
                aria-busy={submission.pending}
              >
                {submissions.enabled
                  ? submission.pending
                    ? site.copy.submission_sending
                    : site.copy.submission_send_request
                  : site.copy.forms_booking_form_complete_demo_39}
                <Check size={17} />
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
