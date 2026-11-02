import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AccessibleDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTheme, themePresets } from "@/config/themes";
function luminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [name, theme] of Object.entries(themePresets)) {
  it(`${name} has readable text and action contrast`, () => {
    for (const surface of ["#ffffff", theme.canvas, theme.tint])
      for (const text of [theme.ink, theme.muted, theme.primary, theme.accent])
        expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.primary, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
}
it("rejects arbitrary theme names", () => {
  expect(getTheme("unknown")).toBe("clinical-blue");
});
it("provides an empty table state and textual statuses", () => {
  render(
    <>
      <DataTable
        caption="Request examples"
        columns={[{ key: "id", label: "Reference", render: (row: { id: string }) => row.id }]}
        rows={[]}
        rowKey={(row) => row.id}
      />
      <StatusBadge status="Declined" />
    </>,
  );
  expect(screen.getByRole("table")).toHaveAccessibleName("Request examples");
  expect(screen.getByText("No records to display.")).toBeVisible();
  expect(screen.getByText("Declined")).toBeVisible();
});
it("opens a labeled dialog and closes with Escape, returning focus", async () => {
  const user = userEvent.setup();
  render(
    <AccessibleDialog
      title="Review example"
      description="No live records"
      trigger={<Button>Open dialog</Button>}
    >
      <p>Example information</p>
    </AccessibleDialog>,
  );
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Review example");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
});
