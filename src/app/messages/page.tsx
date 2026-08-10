import { messageService } from "@/lib/services/message";
import Link from "next/link";
import { MessageStatus, MessageType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, Filter, Settings, MessageSquare } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; q?: string; page?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const data = await messageService.getAllMessages({
    ...searchParams,
    page
  });
  
  // Note: search filtering by guest name/code is now handled in messageService.getAllMessages

  const messages = data.items || [];
  const totalPages = data.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Message Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            View outbound operational communication.
          </p>
        </div>
        <Button href="/messages/templates" variant="secondary" icon={<Settings className="w-4 h-4" />}>
          Manage Templates
        </Button>
      </div>

      <Card>
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
                placeholder="Search guest or code..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <select
                name="type"
                defaultValue={searchParams.type || "ALL"}
                className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Types</option>
                {Object.values(MessageType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              
              <select
                name="status"
                defaultValue={searchParams.status || "ALL"}
                className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(MessageStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <Button type="submit" variant="secondary" icon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guest & Res</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type / Channel</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                      <MessageSquare className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900">No messages found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                messages.map(msg => (
                  <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(msg.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        <Link href={`/guests/${msg.guest.id}`} className="hover:text-blue-600 transition-colors">
                          {msg.guest.firstName} {msg.guest.lastName}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <Link href={`/reservations/${msg.reservation.id}`} className="hover:text-blue-600 transition-colors">
                          {msg.reservation.code}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{msg.type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-500 mt-0.5">WhatsApp</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ' ? 'success' :
                        msg.status === 'FAILED' ? 'danger' :
                        'warning'
                      }>
                        {msg.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {(msg as any).providerMessageId ? (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{(msg as any).providerMessageId}</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">{(msg as any).errorInfo || "-"}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} />
      </Card>
    </div>
  );
}
