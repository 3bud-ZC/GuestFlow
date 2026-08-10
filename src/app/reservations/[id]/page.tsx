import { reservationService } from "@/lib/services/reservation";
import { messageService } from "@/lib/services/message";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusForm } from "./StatusForm";
import { MessageLog } from "./MessageLog";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeft, BookOpen, User, Users, Building, DoorClosed, CalendarDays, Activity, MessageSquare, ExternalLink, CheckSquare } from "lucide-react";

export default async function ReservationDetailsPage({ params }: { params: { id: string } }) {
  const reservation = await reservationService.getReservationById(params.id);
  if (!reservation) notFound();

  const messages = await messageService.getReservationMessages(reservation.id);
  const tasks = await db.task.findMany({
    where: { reservationId: reservation.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/reservations" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Reservations
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reservation: {reservation.code}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Badge variant="neutral" className="text-xs font-medium">via {reservation.platform}</Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Stay Details" />
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Guest</div>
                      {reservation.guest ? (
                        <Link href={`/guests/${reservation.guest.id}`} className="mt-0.5 block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                          {reservation.guest.firstName} {reservation.guest.lastName}
                        </Link>
                      ) : (
                        <div className="mt-0.5 block text-sm font-medium text-red-600">
                          Guest Details Required
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Guests Count</div>
                      <div className="mt-0.5 text-sm text-slate-900">{reservation.numberOfGuests}</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Property</div>
                      <div className="mt-0.5 text-sm text-slate-900">{reservation.property.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DoorClosed className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Room</div>
                      <div className="mt-0.5 text-sm text-slate-900">{reservation.room.name}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex flex-col sm:flex-row gap-6">
                <div className="flex items-start gap-3 flex-1">
                  <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Check-in</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-900">
                      {new Date(reservation.checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block w-px bg-slate-200"></div>
                
                <div className="flex items-start gap-3 flex-1">
                  <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Check-out</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-900">
                      {new Date(reservation.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {tasks.length > 0 && (
            <Card>
              <CardHeader title="Related Tasks" />
              <div className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <CheckSquare className={`w-5 h-5 mt-0.5 shrink-0 ${task.status === 'DONE' ? 'text-green-500' : 'text-slate-400'}`} />
                      <div>
                        <p className={`font-medium text-sm ${task.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <Badge variant={
                          task.status === 'DONE' ? 'success' :
                          task.status === 'IN_PROGRESS' ? 'info' :
                          'neutral'
                        } className="mt-2 text-xs">
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button href={`/tasks/${task.id}`} variant="outline" size="sm" className="shrink-0">
                      View Task
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2 p-6 border-b border-slate-100">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
            </div>
            <CardContent>
              <div className="space-y-6">
                {reservation.activityLogs.length === 0 ? (
                  <div className="py-6">
                    <EmptyState 
                      icon={Activity}
                      title="No activity logged yet"
                      description="Actions taken on this reservation will appear here."
                    />
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                    {reservation.activityLogs.map((log, i) => (
                      <div key={log.id} className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[7.5px] top-1.5"></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{log.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                          </p>
                          {log.metadata && (
                            <div className="mt-2 bg-slate-50 rounded border border-slate-100 p-3 overflow-x-auto">
                              <pre className="text-xs text-slate-600 font-mono">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="sticky top-6">
            <CardHeader title="Reservation Status" />
            <CardContent>
              <StatusForm reservationId={reservation.id} currentStatus={reservation.status} guestDocumentStatus={reservation.guest ? reservation.guest.documentStatus : 'PENDING'} />
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center gap-2 p-5 border-b border-slate-100">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Guest Communication</h2>
            </div>
            <CardContent className="p-0">
              <div className="p-5">
                <MessageLog 
                  reservationId={reservation.id} 
                  messages={messages} 
                  reservationStatus={reservation.status} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Guest ID Status" />
            <CardContent>
              <div className="flex items-center justify-between">
                {reservation.guest ? (
                  <>
                    <Badge variant={
                      reservation.guest.documentStatus === 'RECEIVED' ? 'success' :
                      reservation.guest.documentStatus === 'PENDING' ? 'warning' :
                      'neutral'
                    }>
                      {reservation.guest.documentStatus}
                    </Badge>
                    <Link href={`/guests/${reservation.guest.id}`} className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1">
                      Update <ExternalLink className="w-3 h-3" />
                    </Link>
                  </>
                ) : (
                  <Badge variant="warning">MISSING</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
