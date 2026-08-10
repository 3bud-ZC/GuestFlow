import { db } from "@/lib/db";
import { AddUserDrawer } from "./AddUserDrawer";
import { DeleteUserButton } from "./DeleteUserButton";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Shield, User } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const cookieStore = await cookies();
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system access, create accounts for receptionists, and assign roles.
          </p>
        </div>
        <AddUserDrawer />
      </div>

      <div className="space-y-4">
        <Card className="shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t.users.name}
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t.users.email}
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t.users.role}
                    </th>
                    <th className="px-6 py-4 ltr:text-right rtl:text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.role === "ADMIN" ? "info" : "success"} className="flex items-center gap-1 w-fit">
                          {user.role === "ADMIN" && <Shield className="w-3 h-3" />}
                          {t.users[user.role as keyof typeof t.users] || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap ltr:text-right rtl:text-left text-sm font-medium">
                        <DeleteUserButton userId={user.id} />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                          <Users className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">{t.empty.noResults}</h3>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
    </div>
  );
}
