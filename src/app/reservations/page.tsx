import { reservationService } from "@/lib/services/reservation";
import Link from "next/link";
import { ReservationPlatform, ReservationStatus, GuestDocumentStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    platform?: string;
    status?: string;
    idStatus?: string;
    dateFilter?: string;
  };
}) {
  const reservations = await reservationService.getReservations(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your bookings, check-ins, and guest stays.
          </p>
        </div>
        <Button href="/reservations/create" variant="primary" icon={<Plus className="w-4 h-4" />}>
          New Reservation
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Search code, guest name, phone..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <select
                name="platform"
                defaultValue={searchParams.platform || "ALL"}
                className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Platforms</option>
                {Object.values(ReservationPlatform).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <select
                name="status"
                defaultValue={searchParams.status || "ALL"}
                className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(ReservationStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              
              <select
                name="dateFilter"
                defaultValue={searchParams.dateFilter || "ALL"}
                className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Check-in Today</option>
                <option value="TOMORROW">Check-in Tomorrow</option>
                <option value="THIS_WEEK">Check-in This Week</option>
              </select>
              
              <Button type="submit" variant="secondary" icon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        {reservations.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No reservations found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Booking</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Property & Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/reservations/${res.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                        {res.code}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-500">{res.platform}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">
                      <Link href={`/guests/${res.guest.id}`} className="hover:underline">
                        {res.guest.firstName} {res.guest.lastName}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{res.numberOfGuests} guest{res.numberOfGuests !== 1 && 's'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div className="font-medium text-slate-700">{new Date(res.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="text-slate-400">to {new Date(res.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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
                      {res.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button href={`/reservations/${res.id}`} variant="ghost" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
