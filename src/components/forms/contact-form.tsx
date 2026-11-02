"use client";
import { site } from "@/config/site";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { inquirySchema, type InquiryValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
export function ContactForm() {
  const [complete, setComplete] = useState(false);
  const statusRef = useRef<HTMLHeadingElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: "", email: "", topic: "", message: "" },
  });
  useEffect(() => {
    if (complete) statusRef.current?.focus();
  }, [complete]);
  const attrs = (key: keyof InquiryValues) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
  });
  const error = (key: keyof InquiryValues) =>
    errors[key] && (
      <span role="alert" className="field-error" id={`contact-${key}-error`}>
        {errors[key]?.message}
      </span>
    );
  if (complete)
    return (
      <div className="contact-form completion">
        <CheckCircle2 size={40} strokeWidth={1.4} />
        <h2 ref={statusRef} tabIndex={-1}>
          {site.copy.forms_contact_form_youve_tried_the_inquiry_form_1}
        </h2>
        <p className="completion-notice" role="status">
          {site.copy.forms_contact_form_this_is_a_demonstration_your_2}
        </p>
        <Button type="button" onClick={() => setComplete(false)}>
          {site.copy.forms_contact_form_try_another_inquiry_3}
        </Button>
      </div>
    );
  return (
    <form
      className="contact-form"
      noValidate
      onSubmit={handleSubmit(() => {
        reset();
        setComplete(true);
      })}
    >
      <span className="eyebrow">{site.copy.forms_contact_form_demo_inquiry_4}</span>
      <h2>{site.copy.forms_contact_form_what_would_you_like_to_5}</h2>
      <p className="form-subtitle">{site.copy.forms_contact_form_try_this_form_using_example_6}</p>
      <div className="fields-grid">
        <div className="field">
          <label htmlFor="contact-name">{site.copy.forms_contact_form_your_name_7}</label>
          <input
            id="contact-name"
            placeholder={site.copy.forms_contact_form_eg_alex_taylor_8}
            maxLength={80}
            autoComplete="off"
            {...register("name")}
            {...attrs("name")}
          />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="contact-email">{site.copy.forms_contact_form_email_address_9}</label>
          <input
            id="contact-email"
            type="email"
            placeholder={site.copy.forms_contact_form_alexexamplecom_10}
            autoComplete="off"
            {...register("email")}
            {...attrs("email")}
          />
          {error("email")}
        </div>
        <div className="field field-full">
          <label htmlFor="contact-topic">{site.copy.forms_contact_form_topic_11}</label>
          <select id="contact-topic" {...register("topic")} {...attrs("topic")}>
            <option value="">{site.copy.forms_contact_form_choose_a_topic_12}</option>
            <option>{site.copy.forms_contact_form_exploring_care_options_13}</option>
            <option>{site.copy.forms_contact_form_service_locations_14}</option>
            <option>{site.copy.forms_contact_form_appointment_arrangements_15}</option>
            <option>{site.copy.forms_contact_form_something_else_16}</option>
          </select>
          {error("topic")}
        </div>
        <div className="field field-full">
          <label htmlFor="contact-message">{site.copy.forms_contact_form_your_message_17}</label>
          <textarea
            id="contact-message"
            rows={4}
            maxLength={500}
            placeholder={site.copy.forms_contact_form_a_general_question_about_home_18}
            {...register("message")}
            {...attrs("message")}
            aria-describedby={`contact-hint${errors.message ? " contact-message-error" : ""}`}
          />
          <span className="field-hint" id="contact-hint">
            {site.copy.forms_contact_form_please_leave_out_medical_histories_19}
          </span>
          {error("message")}
        </div>
      </div>
      <p className="small muted form-disclaimer">
        {site.copy.forms_contact_form_this_form_is_a_demonstration_20}
      </p>
      <Button type="submit">
        {site.copy.forms_contact_form_preview_inquiry_completion_21}
        <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
