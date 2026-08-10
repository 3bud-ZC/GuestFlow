import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shrink-0">
      <Link href="/" className="font-bold text-xl text-blue-700 tracking-tight">
        GuestFlow
      </Link>
      {user && (
        <>
          <nav className="ltr:ml-10 rtl:mr-10 flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-blue-600 cursor-pointer">
              Dashboard
            </Link>
            <Link href="/reservations" className="hover:text-blue-600 cursor-pointer">
              Reservations
            </Link>
            <Link href="/guests" className="hover:text-blue-600 cursor-pointer">
              Guests
            </Link>
            <Link href="/tasks" className="hover:text-blue-600 cursor-pointer">
              Tasks
            </Link>
            <Link href="/messages" className="hover:text-blue-600 cursor-pointer">
              Messages
            </Link>
            {user.role === "ADMIN" && (
              <>
                <Link href="/properties" className="hover:text-blue-600 cursor-pointer">
                  Properties
                </Link>
                <Link href="/settings" className="hover:text-blue-600 cursor-pointer">
                  Settings
                </Link>
                <Link href="/admin/users" className="hover:text-blue-600 cursor-pointer">
                  Users
                </Link>
              </>
            )}
          </nav>
          <div className="ltr:ml-auto rtl:mr-auto text-sm text-gray-500 flex items-center gap-4">
            <div className="flex flex-col ltr:text-right rtl:text-left">
              <span className="font-medium text-gray-900">{user.email}</span>
              <span className="text-xs">{user.role}</span>
            </div>
            <LogoutButton />
          </div>
        </>
      )}
    </header>
  );
}
