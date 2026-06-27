import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from "react";

// ==========================================================
// DataTable — wrapper tabel konsisten untuk halaman admin (desktop).
// Menghilangkan hand-built <table> di tenants/invoices/users/logs/backups.
//
// Pakai:
//   <DataTable>
//     <DataTable.Head>
//       <DataTable.Th>Nama</DataTable.Th>
//     </DataTable.Head>
//     <DataTable.Body>
//       <DataTable.Tr>
//         <DataTable.Td>...</DataTable.Td>
//       </DataTable.Tr>
//     </DataTable.Body>
//   </DataTable>
// ==========================================================

interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function DataTable({ children, className = "", ...props }: DataTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${className}`} {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

function Head({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>{children}</tr>
    </thead>
  );
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
}

function Th({ children, align = "left", className = "", ...props }: ThProps) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

function Tr({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50/60 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
}

function Td({ children, align = "left", className = "", ...props }: TdProps) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <td className={`px-4 py-3 text-slate-700 ${alignClass} ${className}`} {...props}>
      {children}
    </td>
  );
}

DataTable.Head = Head;
DataTable.Th = Th;
DataTable.Body = Body;
DataTable.Tr = Tr;
DataTable.Td = Td;
