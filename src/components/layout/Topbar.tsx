"use client";

import { LogoutButton } from "@/components/LogoutButton";
import { User, Shield, Plus, CalendarPlus, UserPlus, Building, Link2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";

export function Topbar({ user }: { user: any }) {
  const pathname = usePathname();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setQuickAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  let pageTitle = "";
  if (pathname === "/") pageTitle = "Dashboard";
  else if (pathname?.startsWith("/calendar")) pageTitle = "Calendar";
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>
            
            {quickAddOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/reservations/create"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <CalendarPlus className="w-4 h-4 text-slate-400" />
                  New Reservation
                </Link>
                <Link
                  href="/guests?action=add"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  Add Guest
                </Link>
                {user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/properties?action=add"
                      onClick={() => setQuickAddOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Building className="w-4 h-4 text-slate-400" />
                      Add Property
                    </Link>
                    <Link
                      href="/properties/connect-airbnb"
                      onClick={() => setQuickAddOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Link2 className="w-4 h-4 text-slate-400" />
                      Connect Airbnb
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

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
          <LanguageToggle />
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
