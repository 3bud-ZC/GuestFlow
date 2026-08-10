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

import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function DashboardPage() {
  const data = await dashboardService.getDashboardData();
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';
  
  const today = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{today}</span>
          </div>
          <p className="mt-1 text-slate-500">
            {t.dashboard.welcomeBack}
          </p>
        </div>
        <Button href="/reservations/create" variant="primary">
          {t.reservations.newReservation}
        </Button>
      </div>

      {/* KPI Row */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${(data as any).whatsappEnabled ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-4`}>
        <MetricCard 
          title={t.dashboard.checkinsToday} 
          value={data.metrics.checkinsToday} 
          icon={<ArrowRight className={`w-5 h-5 text-blue-600 ${isRtl ? 'rotate-180' : ''}`} />}
          trend={t.dashboard.arrivals}
        />
        <MetricCard 
          title={t.dashboard.checkoutsToday} 
          value={data.metrics.checkoutsToday} 
          icon={<ArrowLeft className={`w-5 h-5 text-emerald-600 ${isRtl ? 'rotate-180' : ''}`} />}
          trend={t.dashboard.departures}
        />
        <MetricCard 
          title={t.dashboard.missingIds} 
          value={data.metrics.missingIds} 
          icon={<FileWarning className="w-5 h-5 text-amber-600" />}
          trend={t.dashboard.pendingCollection}
          urgent={data.metrics.missingIds > 0}
        />
        <MetricCard 
          title={t.dashboard.openTasks} 
          value={data.metrics.openTasks} 
          icon={<CheckSquare className="w-5 h-5 text-slate-600" />}
          trend={t.dashboard.requiresAction}
          urgent={data.metrics.openTasks > 0}
        />
        {(data as any).whatsappEnabled && (
          <>
            <MetricCard 
              title={t.dashboard.failedMessages} 
              value={data.metrics.failedMessages} 
              icon={<MessageSquareWarning className="w-5 h-5 text-red-600" />}
              trend={t.dashboard.deliveryErrors}
              urgent={data.metrics.failedMessages > 0}
            />
            <MetricCard 
              title={t.dashboard.scheduledMessages} 
              value={data.metrics.scheduledMessages} 
              icon={<Clock className="w-5 h-5 text-indigo-600" />}
              trend={t.dashboard.automatedQueue}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Required */}
        <div className="lg:col-span-1">
          <Card className="h-full border-amber-200 shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                {t.dashboard.actionRequired}
              </h2>
              {data.actionRequired.length > 0 && (
                <Badge variant="warning">{data.actionRequired.length}</Badge>
              )}
            </div>
            
            <div className="divide-y divide-slate-100 flex-1">
              {data.actionRequired.length === 0 ? (
                <div className="p-6">
                  <div className="py-6 px-4 bg-slate-50 rounded-xl text-center flex flex-col items-center">
                    <CheckSquare className="w-8 h-8 text-slate-400 mb-2" />
                    <h3 className="text-sm font-medium text-slate-900">{t.dashboard.allCaughtUp}</h3>
                  </div>
                </div>
              ) : (
                <>
                  {data.actionRequired.slice(0, 8).map((action: any, idx: number) => {
                    let messageText = '';
                    switch (action.type) {
                      case 'MISSING_ID':
                        messageText = (t.dashboard as any).missingIdForGuest?.replace('{guest}', action.guestName || '') || `${action.guestName} checking in today is missing ID`;
                        break;
                      case 'MISSING_GUEST':
                        messageText = (t.dashboard as any).missingGuestDetails?.replace('{code}', action.reservationCode || '') || `Airbnb check-in today (${action.reservationCode}) requires guest details`;
                        break;
                      case 'OPEN_TASK':
                        messageText = (t.dashboard as any).openTaskPriority?.replace('{priority}', t.tasks[action.urgency as keyof typeof t.tasks] || action.urgency).replace('{title}', action.taskTitle || '') || `[${action.urgency}] ${action.taskTitle}`;
                        break;
                      case 'FAILED_MESSAGE':
                        messageText = (t.dashboard as any).failedMessageForGuest?.replace('{guest}', action.guestName || '') || `WhatsApp delivery failed for ${action.guestName}`;
                        break;
                      case 'CHECKIN_TODAY':
                        messageText = (t.dashboard as any).checkinPendingFor?.replace('{guest}', action.guestName || '') || `${action.guestName} check-in pending`;
                        break;
                      case 'CHECKOUT_TODAY':
                        messageText = (t.dashboard as any).checkoutPendingFor?.replace('{guest}', action.guestName || '') || `${action.guestName} check-out pending`;
                        break;
                      default:
                        messageText = 'Action required';
                    }

                    return (
                      <Link key={idx} href={action.link} className="block p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                action.urgency === 'URGENT' || action.urgency === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500'
                              }`} />
                              <span className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                                {messageText}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors ${isRtl ? 'rotate-180' : ''}`} />
                        </div>
                      </Link>
                    );
                  })}
                  {data.actionRequired.length > 8 && (
                    <Link href="/tasks" className="block p-4 text-center text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors">
                      {t.common.viewAll} ({data.actionRequired.length})
                    </Link>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Today's Arrivals */}
          <Card>
            <CardHeader title={t.dashboard.todaysArrivals} action={
              <Badge variant="neutral">{data.todaysCheckins.length}</Badge>
            } />
            {data.todaysCheckins.length === 0 ? (
              <div className="p-6">
                <div className="py-6 px-4 bg-slate-50 rounded-xl text-center flex flex-col items-center">
                  <PlaneLanding className="w-8 h-8 text-slate-400 mb-2" />
                  <h3 className="text-sm font-medium text-slate-900">{t.dashboard.noArrivals}</h3>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>{t.reservations.guest}</TableHead>
                  <TableHead>{t.reservations.room}</TableHead>
                  <TableHead>{t.reservations.status}</TableHead>
                  <TableHead><span className="sr-only">{t.common.actions}</span></TableHead>
                </TableHeader>
                <TableBody>
                  {data.todaysCheckins.slice(0, 5).map((res: any) => (
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
                            {t.guests[res.guest.documentStatus as keyof typeof t.guests] || res.guest.documentStatus}
                          </Badge>
                        ) : (
                          <Badge variant="warning">MISSING</Badge>
                        )}
                      </TableCell>
                      <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                        <Button href={`/reservations/${res.id}`} variant="ghost" size="sm">
                          {t.properties.manage}
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
            <CardHeader title={t.dashboard.todaysDepartures} action={
              <Badge variant="neutral">{data.todaysCheckouts.length}</Badge>
            } />
            {data.todaysCheckouts.length === 0 ? (
              <div className="p-6">
                <div className="py-6 px-4 bg-slate-50 rounded-xl text-center flex flex-col items-center">
                  <PlaneTakeoff className="w-8 h-8 text-slate-400 mb-2" />
                  <h3 className="text-sm font-medium text-slate-900">{t.dashboard.noDepartures}</h3>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>{t.reservations.guest}</TableHead>
                  <TableHead>{t.reservations.room}</TableHead>
                  <TableHead><span className="sr-only">{t.common.actions}</span></TableHead>
                </TableHeader>
                <TableBody>
                  {data.todaysCheckouts.slice(0, 5).map((res: any) => (
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
                      <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                        <Button href={`/reservations/${res.id}`} variant="ghost" size="sm">
                          {t.properties.manage}
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
