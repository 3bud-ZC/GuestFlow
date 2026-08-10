import { taskService } from "@/lib/services/task";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskStatusForm } from "./TaskStatusForm";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, CheckSquare, Clock, AlignLeft, Flag, Tag, Link2, CalendarCheck } from "lucide-react";

export default async function TaskDetailsPage({ params }: { params: { id: string } }) {
  const task = await taskService.getTaskById(params.id);
  if (!task) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <Link href="/tasks" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{task.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="w-4 h-4 shrink-0" />
              Created {new Date(task.createdAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlignLeft className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Description</h2>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Priority</h2>
              </div>
              <Badge variant={
                task.priority === 'URGENT' ? 'danger' :
                task.priority === 'HIGH' ? 'warning' :
                task.priority === 'MEDIUM' ? 'info' :
                'neutral'
              } className="text-sm px-3 py-1">
                {task.priority}
              </Badge>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Status</h2>
              </div>
              <div>
                <TaskStatusForm taskId={task.id} currentStatus={task.status} />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Context & Links</h2>
            </div>
            <div className="space-y-3">
              {task.reservation && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="text-slate-500 w-32">Reservation:</span>
                  <Link href={`/reservations/${task.reservation.id}`} className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    {task.reservation.code}
                  </Link>
                </div>
              )}
              {task.guest && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="text-slate-500 w-32">Guest:</span>
                  <Link href={`/guests/${task.guest.id}`} className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    {task.guest.firstName} {task.guest.lastName}
                  </Link>
                </div>
              )}
              {!task.reservation && !task.guest && (
                <p className="text-sm text-slate-500 italic">No linked context.</p>
              )}
            </div>
          </div>

          {task.completedAt && (
            <div className="p-6 border-t border-green-100 bg-green-50/50 rounded-b-xl">
              <div className="flex items-center gap-2 text-green-700">
                <CalendarCheck className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Completed {new Date(task.completedAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
