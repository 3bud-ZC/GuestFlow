import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getCurrentUser } from "@/lib/auth";

export async function AppShell({ children, pageTitle }: { children: React.ReactNode; pageTitle?: string }) {
  const user = await getCurrentUser();

  // If no user, it means we might be on a public page like /login
  // NextAuth middleware handles redirects, so we just render children if needed.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
