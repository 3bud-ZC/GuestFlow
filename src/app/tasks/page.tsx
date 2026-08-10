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
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const [data, cookieStore] = await Promise.all([
    taskService.getTasks({ ...resolvedSearchParams, page }),
    cookies(),
  ]);
  const tasks = data.items || [];
  const totalPages = data.totalPages || 1;
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.tasks}</h1>
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
                <select name="status" defaultValue={resolvedSearchParams.status || "ALL"} className="block w-full sm:w-auto py-2 ltr:pl-3 rtl:pr-3 ltr:pr-8 rtl:pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  <option value="ALL">{t.common.allStatuses || 'All Statuses'}</option>
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t.tasks[s as keyof typeof t.tasks] || s}</option>)}
                </select>
                <select name="priority" defaultValue={resolvedSearchParams.priority || "ALL"} className="block w-full sm:w-auto py-2 ltr:pl-3 rtl:pr-3 ltr:pr-8 rtl:pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  <option value="ALL">{t.common.allPriorities || 'All Priorities'}</option>
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{t.tasks[p as keyof typeof t.tasks] || p}</option>)}
                </select>
                <Button type="submit" variant="secondary" icon={<Filter className="w-4 h-4" />}>
                  {t.common.filter}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            {tasks.length === 0 ? (
              <EmptyState 
                icon={CheckSquare}
                title={t.empty.noResults}
                description=""
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>{t.tasks.title}</TableHead>
                  <TableHead>{t.tasks.priority}</TableHead>
                  <TableHead>{t.tasks.status}</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead><span className="sr-only">{t.common.actions}</span></TableHead>
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
                          {t.tasks[task.priority as keyof typeof t.tasks] || task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.status === 'DONE' ? 'success' :
                          task.status === 'IN_PROGRESS' ? 'warning' :
                          task.status === 'CANCELLED' ? 'neutral' :
                          'info'
                        }>
                          {t.tasks[task.status as keyof typeof t.tasks] || task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {task.reservation && (
                          <Link href={`/reservations/${task.reservation.id}`} className="text-blue-600 hover:underline">
                            Res: <span dir="ltr">{task.reservation.code}</span>
                          </Link>
                        )}
                        {!task.reservation && task.guest && (
                          <Link href={`/guests/${task.guest.id}`} className="text-blue-600 hover:underline">
                            Guest: {task.guest.firstName}
                          </Link>
                        )}
                        {!task.reservation && !task.guest && "-"}
                      </TableCell>
                      <TableCell className="ltr:text-right rtl:text-left">
                        <Button href={`/tasks/${task.id}`} variant="ghost" size="sm">
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
