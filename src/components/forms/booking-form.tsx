"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Pencil, Info } from "lucide-react";
import { services } from "@/data/services";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/components/shared/service-icon";
import { bookingSchema, localToday, type BookingValues } from "@/lib/validations";

export function BookingForm() {
  const params = useSearchParams();
  const initialService = services.some((s) => s.slug === params.get("service"))
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
    resolver: zodResolver(bookingSchema),
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
  const review = () => setStep(2);
  const finish = () => {
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
        <span className="eyebrow">DEMO COMPLETE</span>
        <h2 ref={headingRef} tabIndex={-1}>
          You’ve explored the request experience.
        </h2>
        <p className="completion-notice" role="status">
          This is a demonstration. Your request has not been submitted or saved.
        </p>
        <p>
          In a live service, the care team would review the request and discuss suitability, timing,
          and availability before confirming an appointment.
        </p>
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
            }}
          >
            Try another request
          </Button>
          <Link href="/services" className="text-link">
            Explore services <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  return (
    <div className="booking-form">
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
            What kind of support are you exploring?
          </h2>
          <p className="form-subtitle">
            Choose one service to begin. You can change it before finishing.
          </p>
          <fieldset
            className="service-options"
            aria-describedby={errors.service ? "service-error" : undefined}
          >
            <legend className="sr-only">Choose a service</legend>
            {services.map((service) => (
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
            <span className="small muted">Step 1 of 3</span>
            <Button type="button" onClick={advance}>
              Continue <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        <div hidden={step !== 1}>
          <h2 ref={step === 1 ? headingRef : undefined} tabIndex={-1}>
            A few details to shape your request.
          </h2>
          <p className="form-subtitle">
            Use example details for this demonstration. All fields are required unless marked
            optional.
          </p>
          <div className="fields-grid">
            <div className="field">
              <label htmlFor="booking-name">Patient or contact name</label>
              <input
                id="booking-name"
                placeholder="e.g. Alex Taylor"
                autoComplete="off"
                maxLength={80}
                {...register("name")}
                {...errorProps("name")}
              />
              {error("name")}
            </div>
            <div className="field">
              <label htmlFor="booking-phone">Contact number</label>
              <input
                id="booking-phone"
                type="tel"
                placeholder="Enter an example phone number"
                autoComplete="off"
                maxLength={25}
                {...register("phone")}
                {...errorProps("phone")}
              />
              {error("phone")}
            </div>
            <div className="field field-full">
              <label htmlFor="booking-email">
                Email <span>(optional)</span>
              </label>
              <input
                id="booking-email"
                type="email"
                placeholder="e.g. alex@example.com"
                autoComplete="off"
                {...register("email")}
                {...errorProps("email")}
              />
              {error("email")}
            </div>
            <div className="field">
              <label htmlFor="booking-date">Preferred date</label>
              <input
                id="booking-date"
                type="date"
                min={localToday()}
                {...register("date")}
                {...errorProps("date")}
              />
              {error("date")}
            </div>
            <div className="field">
              <label htmlFor="booking-time">Preferred time window</label>
              <select id="booking-time" {...register("time")} {...errorProps("time")}>
                <option value="">Select a time window</option>
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
                General inquiry <span>(optional)</span>
              </label>
              <textarea
                id="booking-inquiry"
                rows={3}
                maxLength={500}
                placeholder="A general question about arrangements or availability"
                {...register("inquiry")}
                {...errorProps("inquiry")}
                aria-describedby={`inquiry-hint${errors.inquiry ? " inquiry-error" : ""}`}
              />
              <span id="inquiry-hint" className="field-hint">
                Please don’t include medical history, test results, or sensitive health details.
              </span>
              {error("inquiry")}
            </div>
          </div>
          <div className="form-note">
            <Info size={17} />
            <p>Dates and time windows are preferences, not available appointments.</p>
          </div>
          <div className="form-actions">
            <Button type="button" variant="text" onClick={() => setStep(0)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button type="submit">
              Review request <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        {step === 2 && (
          <div>
            <h2 ref={headingRef} tabIndex={-1}>
              Does everything look right?
            </h2>
            <p className="form-subtitle">
              Review your example request before completing the demonstration.
            </p>
            <div className="review-section">
              <div className="review-heading">
                <h3>Your chosen service</h3>
                <button type="button" onClick={() => setStep(0)}>
                  <Pencil size={14} /> Change
                </button>
              </div>
              <p className="selected-service">
                <ServiceIcon slug={values.service} size={23} />
                {services.find((s) => s.slug === values.service)?.title}
              </p>
            </div>
            <div className="review-section">
              <div className="review-heading">
                <h3>Request details</h3>
                <button type="button" onClick={() => setStep(1)}>
                  <Pencil size={14} /> Edit details
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
                This is a demonstration. Finishing will not book an appointment, send a request, or
                save your details.
              </p>
            </div>
            <div className="form-actions">
              <Button type="button" variant="text" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button type="submit">
                Complete demo <Check size={17} />
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
