import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
        <Search className="w-8 h-8 text-slate-400" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Page not found</h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        The page you requested doesn't exist or may have moved.
      </p>
      <Button href="/">
        Back to Dashboard
      </Button>
    </div>
  );
}
