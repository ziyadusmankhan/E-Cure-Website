import type { ReactNode } from "react";
export type TableColumn<T> = { key: string; label: string; render: (row: T) => ReactNode };
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage = "No records to display.",
}: {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  return (
    <table className="data-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th scope="col" key={c.key}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>
                  <span className="mobile-cell-label" aria-hidden="true">
                    {c.label}
                  </span>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length}>{emptyMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
