"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

function getInitialLocale(): "en" | "ar" {
  if (typeof document !== "undefined") {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("gf-locale="))
      ?.split("=")[1];
    if (cookieLocale === "ar") {
      return "ar";
    }
  }
  return "en";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale] = useState<"en" | "ar">(getInitialLocale);

  const isAr = locale === "ar";

  return (
    <html lang={locale} dir={isAr ? "rtl" : "ltr"}>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
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
                  ? "حدث خطأ فادح. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقًا."
                  : "A critical error occurred. Please refresh the page or try again later."}
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
      </body>
    </html>
  );
}
