import { ReactNode } from "react";

export function Table({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm ltr:text-left rtl:text-right whitespace-nowrap">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHead({ children, className = "" }: { children: ReactNode, className?: string }) {
  return <th className={`px-6 py-3 font-medium ${className}`}>{children}</th>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: ReactNode, className?: string }) {
  return <tr className={`hover:bg-slate-50/50 transition-colors ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = "" }: { children: ReactNode, className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}
