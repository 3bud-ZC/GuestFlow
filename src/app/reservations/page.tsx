import { reservationService } from "@/lib/services/reservation";
import Link from "next/link";
import { ReservationPlatform, ReservationStatus, GuestDocumentStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, Filter, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    status?: string;
    idStatus?: string;
    dateFilter?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const data = await reservationService.getReservations({ ...resolvedSearchParams, page });
  const reservations = data.items || [];
  const totalPages = data.totalPages || 1;
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.reservations}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your bookings, check-ins, and guest stays.
          </p>
        </div>
        <Button href="/reservations/create" variant="primary" icon={<Plus className="w-4 h-4" />}>
          {t.reservations.newReservation}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={resolvedSearchParams.q || ""}
                placeholder="Search code, guest name, phone..."
                className="block w-full ltr:pl-10 rtl:pr-10 ltr:pr-3 rtl:pl-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <select
                name="platform"
                defaultValue={resolvedSearchParams.platform || "ALL"}
                className="block w-full sm:w-auto py-2 ltr:pl-3 rtl:pr-3 ltr:pr-8 rtl:pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Platforms</option>
                {Object.values(ReservationPlatform).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <select
                name="status"
                defaultValue={resolvedSearchParams.status || "ALL"}
                className="block w-full sm:w-auto py-2 ltr:pl-3 rtl:pr-3 ltr:pr-8 rtl:pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(ReservationStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              
              <select
                name="dateFilter"
                defaultValue={resolvedSearchParams.dateFilter || "ALL"}
                className="block w-full sm:w-auto py-2 ltr:pl-3 rtl:pr-3 ltr:pr-8 rtl:pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Check-in Today</option>
                <option value="TOMORROW">Check-in Tomorrow</option>
                <option value="THIS_WEEK">Check-in This Week</option>
              </select>
              
              <Button type="submit" variant="secondary" icon={<Filter className="w-4 h-4" />}>
                {t.common.filter}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        {reservations.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t.empty.noResults}
            description=""
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>{t.reservations.reservation}</TableHead>
                  <TableHead>{t.reservations.guest}</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>{t.reservations.property} & {t.reservations.room}</TableHead>
                  <TableHead>{t.reservations.status}</TableHead>
                  <TableHead><span className="sr-only">{t.common.actions}</span></TableHead>
                </TableHeader>
                <TableBody>
                  {reservations.map((res: any) => (
                    <TableRow key={res.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/reservations/${res.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                            <span dir="ltr">{res.code}</span>
                          </Link>
                        </div>
                        <div className="text-xs text-slate-500">{res.platform}</div>
                      </TableCell>
                      <TableCell>
                        {res.guest ? (
                          <>
                            <div className="text-sm font-medium text-slate-900">
                              <Link href={`/guests/${res.guest.id}`} className="hover:underline">
                                {res.guest.firstName} {res.guest.lastName}
                              </Link>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{res.numberOfGuests} guest{res.numberOfGuests !== 1 && 's'}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" /> Guest details required
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Imported from Airbnb</div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <div className="font-medium text-slate-700">{new Date(res.checkInDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-slate-400">to {new Date(res.checkOutDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-900 font-medium">{res.property.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{res.room.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          res.status === 'CONFIRMED' ? 'info' :
                          res.status === 'CHECKED_IN' ? 'success' :
                          res.status === 'CHECKED_OUT' ? 'neutral' :
                          'warning'
                        }>
                          {t.reservations[res.status as keyof typeof t.reservations] || res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="ltr:text-right rtl:text-left">
                        <Button href={`/reservations/${res.id}`} variant="ghost" size="sm">
                          {t.properties.manage}
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
  );
}
