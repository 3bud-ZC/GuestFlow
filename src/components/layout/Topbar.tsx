"use client";

import { LogoutButton } from "@/components/LogoutButton";
import { User, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

export function Topbar({ user }: { user: any }) {
  const pathname = usePathname();
  
  let pageTitle = "";
  if (pathname === "/") pageTitle = "Dashboard";
  else if (pathname?.startsWith("/reservations")) pageTitle = "Reservations";
  else if (pathname?.startsWith("/guests")) pageTitle = "Guests";
  else if (pathname?.startsWith("/tasks")) pageTitle = "Tasks";
  else if (pathname?.startsWith("/messages")) pageTitle = "Messages";
  else if (pathname?.startsWith("/properties")) pageTitle = "Properties";
  else if (pathname?.startsWith("/settings")) pageTitle = "Settings";
  else if (pathname?.startsWith("/admin/users")) pageTitle = "Users";

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 shrink-0 xl:pl-6 pl-14 transition-all z-30 relative">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 truncate">
          {pageTitle}
        </h1>
      </div>
      
      {user && (
        <div className="ml-4 flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium text-slate-900">{user.name || user.email}</span>
            <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
              {user.role === "ADMIN" ? (
                <Shield className="w-3 h-3 text-blue-600" />
              ) : (
                <User className="w-3 h-3 text-slate-400" />
              )}
              {user.role}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
