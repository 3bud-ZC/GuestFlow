export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`${noPadding ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}
