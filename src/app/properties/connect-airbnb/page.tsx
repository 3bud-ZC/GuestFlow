import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AirbnbWizard } from "./AirbnbWizard";
import { ArrowLeft, Link2 } from "lucide-react";
import Link from "next/link";

export default async function ConnectAirbnbPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/properties" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Properties
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connect Airbnb</h1>
            <p className="mt-1 text-sm text-slate-500">
              Link an Airbnb calendar to sync reservations and availability.
            </p>
          </div>
        </div>
      </div>

      <AirbnbWizard />
    </div>
  );
}
