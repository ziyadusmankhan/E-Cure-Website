import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/ui/accordion";
import Link from "next/link";
it("keeps a disabled action inactive and renders link buttons as anchors", async () => {
  render(<><Button disabled>Unavailable</Button><Button asChild><Link href="/services">Explore</Link></Button></>);
  expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/services");
});
it("opens and closes FAQ content using the keyboard", async () => {
  const user = userEvent.setup();
  render(<FAQ items={[{ question: "Is this a confirmed appointment?", answer: "No, this is a demo request." }]} />);
  await user.tab(); await user.keyboard("{Enter}");
  expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("No, this is a demo request.")).toBeVisible();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
});
