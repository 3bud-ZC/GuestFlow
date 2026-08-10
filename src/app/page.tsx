import { dashboardService } from "@/lib/services/dashboard";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  ArrowRight, 
  ArrowLeft, 
  FileWarning, 
  CheckSquare, 
  MessageSquareWarning, 
  Clock, 
  AlertCircle,
  Calendar,
  ChevronRight,
  PlaneLanding,
  PlaneTakeoff
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await dashboardService.getDashboardData();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{today}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Guest Operations</h1>
          <p className="mt-1 text-slate-500">
            Welcome back. Here's what needs attention today.
          </p>
        </div>
        <Button href="/reservations/create" variant="primary">
          New Reservation
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard 
          title="Check-ins Today" 
          value={data.metrics.checkinsToday} 
          icon={<ArrowRight className="w-5 h-5 text-blue-600" />}
          trend="Arrivals"
        />
        <MetricCard 
          title="Check-outs Today" 
          value={data.metrics.checkoutsToday} 
          icon={<ArrowLeft className="w-5 h-5 text-emerald-600" />}
          trend="Departures"
        />
        <MetricCard 
          title="Missing IDs" 
          value={data.metrics.missingIds} 
          icon={<FileWarning className="w-5 h-5 text-amber-600" />}
          trend="Pending collection"
          urgent={data.metrics.missingIds > 0}
        />
        <MetricCard 
          title="Open Tasks" 
          value={data.metrics.openTasks} 
          icon={<CheckSquare className="w-5 h-5 text-slate-600" />}
          trend="Requires action"
        />
        <MetricCard 
          title="Failed Messages" 
          value={data.metrics.failedMessages} 
          icon={<MessageSquareWarning className="w-5 h-5 text-red-600" />}
          trend="Delivery errors"
          urgent={data.metrics.failedMessages > 0}
        />
        <MetricCard 
          title="Scheduled Msgs" 
          value={data.metrics.scheduledMessages} 
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
          trend="Automated queue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Required */}
        <div className="lg:col-span-1">
          <Card className="h-full border-amber-200 shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Action Required
              </h2>
              {data.actionRequired.length > 0 && (
                <Badge variant="warning">{data.actionRequired.length}</Badge>
              )}
            </div>
            
            <div className="divide-y divide-slate-100 flex-1">
              {data.actionRequired.length === 0 ? (
                <div className="h-full min-h-[200px] flex items-center justify-center p-6">
                  <EmptyState 
                    icon={CheckSquare}
                    title="All caught up"
                    description="No urgent actions pending"
                  />
                </div>
              ) : (
                data.actionRequired.map((action, idx) => (
                  <Link key={idx} href={action.link} className="block p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            action.urgency === 'URGENT' || action.urgency === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500'
                          }`} />
                          <span className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                            {action.message}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Today's Arrivals */}
          <Card>
            <CardHeader title="Today's Arrivals" action={
              <Badge variant="neutral">{data.todaysCheckins.length} expected</Badge>
            } />
            {data.todaysCheckins.length === 0 ? (
              <div className="p-6">
                <EmptyState 
                  icon={PlaneLanding}
                  title="No arrivals"
                  description="No check-ins scheduled for today."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableHeader>
                <TableBody>
                  {data.todaysCheckins.map(res => (
                    <TableRow key={res.id}>
                      <TableCell>
                        {res.guest ? (
                          <>
                            <div className="font-medium text-slate-900">{res.guest.firstName} {res.guest.lastName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{res.code} · {res.platform}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Guest details required
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{res.code} · {res.platform}</div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {res.room.name}
                      </TableCell>
                      <TableCell>
                        {res.guest ? (
                          <Badge variant={
                            res.guest.documentStatus === 'RECEIVED' ? 'success' :
                            res.guest.documentStatus === 'PENDING' ? 'warning' : 'neutral'
                          }>
                            {res.guest.documentStatus}
                          </Badge>
                        ) : (
                          <Badge variant="warning">MISSING</Badge>
                        )}
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

          {/* Today's Departures */}
          <Card>
            <CardHeader title="Today's Departures" action={
              <Badge variant="neutral">{data.todaysCheckouts.length} expected</Badge>
            } />
            {data.todaysCheckouts.length === 0 ? (
              <div className="p-6">
                <EmptyState 
                  icon={PlaneTakeoff}
                  title="No departures"
                  description="No check-outs scheduled for today."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableHeader>
                <TableBody>
                  {data.todaysCheckouts.map(res => (
                    <TableRow key={res.id}>
                      <TableCell>
                        {res.guest ? (
                          <>
                            <div className="font-medium text-slate-900">{res.guest.firstName} {res.guest.lastName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{res.code}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Guest details required
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{res.code}</div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {res.room.name}
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
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, urgent = false }: { title: string, value: string | number, icon: React.ReactNode, trend: string, urgent?: boolean }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${urgent ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={`p-1.5 rounded-md ${urgent ? 'bg-red-50' : 'bg-slate-50'}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className={`text-2xl font-bold ${urgent ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}
