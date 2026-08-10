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

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || "";
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const data = await guestService.getGuests({ query, page });
  const guests = data.items || [];
  const totalPages = data.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guests</h1>
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="Search by name, email, or phone..."
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white"
                  />
                </div>
                <Button type="submit" variant="secondary" icon={<Search className="w-4 h-4" />}>
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            {guests.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="No guests found"
                description="Try a different search term or add a new guest."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>ID Status</TableHead>
                  <TableHead>Stays</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
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
                        <div className="text-sm text-slate-700">{guest.phone || "-"}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{guest.email || ""}</div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {(guest as any).nationality || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          guest.documentStatus === 'RECEIVED' ? 'success' :
                          guest.documentStatus === 'PENDING' ? 'warning' : 'neutral'
                        }>
                          {guest.documentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {guest._count.reservations}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button href={`/guests/${guest.id}`} variant="ghost" size="sm">
                          View
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
