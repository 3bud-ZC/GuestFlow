"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

function getInitialLocale(): "en" | "ar" {
  if (typeof document !== "undefined") {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("gf-locale="))
      ?.split("=")[1];
    if (cookieLocale === "ar" || document.documentElement.lang === "ar") {
      return "ar";
    }
  }
  return "en";
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale] = useState<"en" | "ar">(getInitialLocale);

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const isAr = locale === "ar";

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            {isAr ? "حدث خطأ" : "Something went wrong"}
          </h2>
          <p className="text-sm text-slate-500">
            {isAr
              ? "واجهنا خطأ غير متوقع. يرجى المحاولة مرة أخرى."
              : "We encountered an unexpected error. Please try again."}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
        >
          {isAr ? "حاول مرة أخرى" : "Try again"}
        </button>
      </div>
    </div>
  );
}
