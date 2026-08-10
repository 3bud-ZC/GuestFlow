import { taskService } from "@/lib/services/task";
import { AddTaskDrawer } from "./AddTaskDrawer";
import Link from "next/link";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckSquare, Filter, AlertCircle } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string; page?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const data = await taskService.getTasks({ ...searchParams, page });
  const tasks = data.items || [];
  const totalPages = data.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage operational items and workflows.
          </p>
        </div>
        <AddTaskDrawer />
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
              <form className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                <select name="status" defaultValue={searchParams.status || "ALL"} className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  <option value="ALL">All Statuses</option>
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <select name="priority" defaultValue={searchParams.priority || "ALL"} className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  <option value="ALL">All Priorities</option>
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Button type="submit" variant="secondary" icon={<Filter className="w-4 h-4" />}>
                  Filter
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            {tasks.length === 0 ? (
              <EmptyState 
                icon={CheckSquare}
                title="No tasks found"
                description="Try adjusting your filters or create a new task."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-slate-900">
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.priority === 'URGENT' ? 'danger' :
                          task.priority === 'HIGH' ? 'warning' :
                          task.priority === 'MEDIUM' ? 'info' :
                          'neutral'
                        }>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.status === 'DONE' ? 'success' :
                          task.status === 'IN_PROGRESS' ? 'warning' :
                          task.status === 'CANCELLED' ? 'neutral' :
                          'info'
                        }>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {task.reservation && (
                          <Link href={`/reservations/${task.reservation.id}`} className="text-blue-600 hover:underline">
                            Res: {task.reservation.code}
                          </Link>
                        )}
                        {!task.reservation && task.guest && (
                          <Link href={`/guests/${task.guest.id}`} className="text-blue-600 hover:underline">
                            Guest: {task.guest.firstName}
                          </Link>
                        )}
                        {!task.reservation && !task.guest && "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button href={`/tasks/${task.id}`} variant="ghost" size="sm">
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
