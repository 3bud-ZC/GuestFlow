export function Badge({ children, variant = "neutral", className = "" }: { children: React.ReactNode, variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary", className?: string }) {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    primary: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
