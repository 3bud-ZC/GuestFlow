"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation, useLocale } from "@/lib/i18n/LocaleProvider";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();
  const t = useTranslation();
  const { locale } = useLocale();
  const isRtl = locale === 'ar';

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6 mt-4">
      <div className="flex justify-between flex-1 sm:hidden">
        {page > 1 ? (
          <Link
            href={createPageUrl(page - 1)}
            className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.common.previous}
          </Link>
        ) : (
          <span className="relative inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 opacity-50">
            {t.common.previous}
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={createPageUrl(page + 1)}
            className="relative mx-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.common.next}
          </Link>
        ) : (
          <span className="relative mx-3 inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 opacity-50">
            {t.common.next}
          </span>
        )}
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: t.common.page.replace('{page}', `<span class="font-medium">${page}</span>`).replace('{total}', `<span class="font-medium">${totalPages}</span>`) }} />
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={createPageUrl(page - 1)}
                className={`relative inline-flex items-center ${isRtl ? 'rounded-r-md' : 'rounded-l-md'} border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50`}
              >
                <span className="sr-only">{t.common.previous}</span>
                <ChevronLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
              </Link>
            ) : (
              <span className={`relative inline-flex items-center ${isRtl ? 'rounded-r-md' : 'rounded-l-md'} border border-slate-300 bg-slate-100 px-2 py-2 text-sm font-medium text-slate-400 opacity-50`}>
                <span className="sr-only">{t.common.previous}</span>
                <ChevronLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={createPageUrl(page + 1)}
                className={`relative inline-flex items-center ${isRtl ? 'rounded-l-md' : 'rounded-r-md'} border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50`}
              >
                <span className="sr-only">{t.common.next}</span>
                <ChevronRight className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
              </Link>
            ) : (
              <span className={`relative inline-flex items-center ${isRtl ? 'rounded-l-md' : 'rounded-r-md'} border border-slate-300 bg-slate-100 px-2 py-2 text-sm font-medium text-slate-400 opacity-50`}>
                <span className="sr-only">{t.common.next}</span>
                <ChevronRight className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
