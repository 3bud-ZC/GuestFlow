export default function Loading() {
  return (
    <div className="w-full h-full flex flex-col p-2 animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
        <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
        <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
      </div>
    </div>
  );
}
