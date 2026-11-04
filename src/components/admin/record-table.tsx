import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function WorkflowStatus({ status }: { status: string }) {
  return <span className="admin-status" data-status={status}>{status}</span>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <div className="admin-empty"><Inbox size={26} aria-hidden="true" /><p>{children}</p><span>Try another search or check back when a request arrives.</span></div>;
}

// One semantic table at every width. Mobile cells show their column labels;
// the real header stays available to assistive technology.
export function RecordTable({ caption, headings, rows, emptyMessage }: { caption: string; headings: string[]; rows: { id: string; cells: ReactNode[] }[]; emptyMessage: string }) {
  if (!rows.length) return <AdminEmpty>{emptyMessage}</AdminEmpty>;
  return <div className="admin-table-wrap"><table role="table">
    <caption className="sr-only">{caption}</caption>
    <thead><tr role="row">{headings.map(heading => <th scope="col" role="columnheader" key={heading}>{heading}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr role="row" key={row.id}>{row.cells.map((cell, index) => <td role="cell" key={headings[index]}><span className="admin-cell-label" aria-hidden="true">{headings[index]}</span><div>{cell}</div></td>)}</tr>)}</tbody>
  </table></div>;
}
