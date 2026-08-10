"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Something went wrong <span className="text-slate-300 mx-2">|</span> حدث خطأ
          </h2>
          <p className="text-sm text-slate-500">
            We encountered an unexpected error. Please try again.
            <br />
            لقد واجهنا خطأ غير متوقع. يرجى المحاولة مرة أخرى.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
        >
          Try again <span className="text-blue-200 mx-2">|</span> حاول مرة أخرى
        </button>
      </div>
    </div>
  );
}
