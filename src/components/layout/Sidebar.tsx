"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckSquare,
  MessageSquare,
  Building2,
  Settings,
  ShieldCheck,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";

import { useTranslation } from "@/lib/i18n/LocaleProvider";

const NAV_ITEMS = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/reservations", labelKey: "reservations", icon: BookOpen },
  { href: "/guests", labelKey: "guests", icon: Users },
  { href: "/properties", labelKey: "properties", icon: Building2 },
];

const OPERATIONS_ITEMS = [
  { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
  { href: "/messages", labelKey: "messages", icon: MessageSquare },
];

const ADMIN_ITEMS = [
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/admin/users", labelKey: "users", icon: ShieldCheck },
];

const NavLink = ({ href, labelKey, icon: Icon, pathname, setIsOpen, t }: { href: string; labelKey: string; icon: any, pathname: string, setIsOpen: (val: boolean) => void, t: any }) => {
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon
        className={`w-[18px] h-[18px] shrink-0 ${
          isActive ? "text-blue-600" : "text-slate-400"
        }`}
      />
      <span className="truncate">{t.navigation[labelKey as keyof typeof t.navigation] || labelKey}</span>
      {isActive && (
        <span className="ltr:ml-auto rtl:mr-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
      )}
    </Link>
  );
};

const SidebarContent = ({ user, pathname, setIsOpen, t }: { user: any, pathname: string, setIsOpen: (val: boolean) => void, t: any }) => (
  <aside className="flex flex-col h-full w-64 bg-white ltr:border-r rtl:border-l border-slate-200">
    {/* Header */}
    <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
      <Link
        href="/"
        onClick={() => setIsOpen(false)}
        className="font-bold text-xl text-slate-900 tracking-tight flex items-center gap-2.5"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        GuestFlow
      </Link>
      {/* Close button — mobile only */}
      <button
        onClick={() => setIsOpen(false)}
        className="ltr:ml-auto rtl:mr-auto xl:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label={t.navigation.closeMenu}
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} setIsOpen={setIsOpen} t={t} />
        ))}
      </div>

      <div>
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {t.navigation.operations}
        </p>
        <div className="space-y-0.5">
          {OPERATIONS_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} setIsOpen={setIsOpen} t={t} />
          ))}
        </div>
      </div>

      {user?.role === "ADMIN" && (
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            {t.navigation.administration}
          </p>
          <div className="space-y-0.5">
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} setIsOpen={setIsOpen} t={t} />
            ))}
          </div>
        </div>
      )}
    </nav>

    {/* Footer — user info */}
    <div className="px-4 py-3 border-t border-slate-100 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-blue-700">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {user?.name || user?.email}
          </p>
          <p className="text-xs text-slate-500 truncate">{t.users[user?.role as keyof typeof t.users] || user?.role}</p>
        </div>
      </div>
    </div>
  </aside>
);

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslation();

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger — mobile only, always visible, left of topbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="xl:hidden fixed top-3.5 ltr:left-4 rtl:right-4 z-40 p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label={t.navigation.openMenu}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar — always visible on xl+ */}
      <div className="hidden xl:flex xl:flex-col xl:w-64 xl:shrink-0">
        <SidebarContent user={user} pathname={pathname} setIsOpen={setIsOpen} t={t} />
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 ltr:left-0 rtl:right-0 rtl:left-auto z-50 xl:hidden transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        <SidebarContent user={user} pathname={pathname} setIsOpen={setIsOpen} t={t} />
      </div>
    </>
  );
}
