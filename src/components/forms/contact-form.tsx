"use client";
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
          You’ve tried the inquiry form.
        </h2>
        <p className="completion-notice" role="status">
          This is a demonstration. Your request has not been submitted or saved.
        </p>
        <Button type="button" onClick={() => setComplete(false)}>
          Try another inquiry
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
      <span className="eyebrow">DEMO INQUIRY</span>
      <h2>What would you like to know?</h2>
      <p className="form-subtitle">Try this form using example details. All fields are required.</p>
      <div className="fields-grid">
        <div className="field">
          <label htmlFor="contact-name">Your name</label>
          <input
            id="contact-name"
            placeholder="e.g. Alex Taylor"
            maxLength={80}
            autoComplete="off"
            {...register("name")}
            {...attrs("name")}
          />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="contact-email">Email address</label>
          <input
            id="contact-email"
            type="email"
            placeholder="alex@example.com"
            autoComplete="off"
            {...register("email")}
            {...attrs("email")}
          />
          {error("email")}
        </div>
        <div className="field field-full">
          <label htmlFor="contact-topic">Topic</label>
          <select id="contact-topic" {...register("topic")} {...attrs("topic")}>
            <option value="">Choose a topic</option>
            <option>Exploring care options</option>
            <option>Service locations</option>
            <option>Appointment arrangements</option>
            <option>Something else</option>
          </select>
          {error("topic")}
        </div>
        <div className="field field-full">
          <label htmlFor="contact-message">Your message</label>
          <textarea
            id="contact-message"
            rows={4}
            maxLength={500}
            placeholder="A general question about home healthcare"
            {...register("message")}
            {...attrs("message")}
            aria-describedby={`contact-hint${errors.message ? " contact-message-error" : ""}`}
          />
          <span className="field-hint" id="contact-hint">
            Please leave out medical histories and sensitive health information.
          </span>
          {error("message")}
        </div>
      </div>
      <p className="small muted form-disclaimer">
        This form is a demonstration. Messages are not sent or saved.
      </p>
      <Button type="submit">
        Preview inquiry completion <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
