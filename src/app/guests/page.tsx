import { guestService } from "@/lib/services/guest";
import Link from "next/link";
import { AddGuestDrawer } from "./AddGuestDrawer";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Users } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const [data, cookieStore] = await Promise.all([
    guestService.getGuests({ query, page }),
    cookies(),
  ]);
  const guests = data.items || [];
  const totalPages = data.totalPages || 1;
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.guests}</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage guest profiles and documents.
          </p>
        </div>
        <AddGuestDrawer />
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <form className="flex gap-3">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="Search by name, email, or phone..."
                    className="block w-full ltr:pl-10 rtl:pr-10 ltr:pr-3 rtl:pl-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white"
                  />
                </div>
                <Button type="submit" variant="secondary" icon={<Search className="w-4 h-4" />}>
                  {t.common.search}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            {guests.length === 0 ? (
              <EmptyState 
                icon={Users}
                title={t.empty.noResults}
                description=""
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>{t.guests.guest}</TableHead>
                  <TableHead>{t.guests.phone}</TableHead>
                  <TableHead>{t.guests.nationality}</TableHead>
                  <TableHead>{t.guests.documentStatus}</TableHead>
                  <TableHead>{t.guests.reservations}</TableHead>
                  <TableHead><span className="sr-only">{t.common.actions}</span></TableHead>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <Link href={`/guests/${guest.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {guest.firstName} {guest.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700" dir="ltr">{guest.phone || "-"}</div>
                        <div className="text-xs text-slate-400 mt-0.5" dir="ltr">{guest.email || ""}</div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {(guest as any).nationality || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          guest.documentStatus === 'RECEIVED' ? 'success' :
                          guest.documentStatus === 'PENDING' ? 'warning' : 'neutral'
                        }>
                          {t.guests[guest.documentStatus as keyof typeof t.guests] || guest.documentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {guest._count.reservations}
                      </TableCell>
                      <TableCell className="ltr:text-right rtl:text-left">
                        <Button href={`/guests/${guest.id}`} variant="ghost" size="sm">
                          {t.common.viewAll}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={page} totalPages={totalPages} />
          </>
        )}
          </Card>
        </div>
    </div>
  );
}
