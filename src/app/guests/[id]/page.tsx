import { guestService } from "@/lib/services/guest";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestDocumentStatus } from "@prisma/client";
import { IDStatusForm } from "./IDStatusForm";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, UserCircle2, Mail, Phone, Globe2, Languages, CalendarDays, MapPin } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function GuestDetailsPage({ params }: { params: { id: string } }) {
  const guest = await guestService.getGuestById(params.id);
  if (!guest) notFound();
  
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guests" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'ml-1 rtl:rotate-180' : 'mr-1'}`} />
          {t.common.previous}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{guest.firstName} {guest.lastName}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="w-4 h-4 shrink-0" />
              {guest.email || "No email on file"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader title="Contact & Profile" />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.guests.email}</div>
                    <div className="mt-0.5 text-sm text-slate-900 break-all">{guest.email || "—"}</div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.guests.phone}</div>
                    <div className="mt-0.5 text-sm text-slate-900" dir="ltr">{guest.phone || "—"}</div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <Globe2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.guests.nationality}</div>
                    <div className="mt-0.5 text-sm text-slate-900">{guest.nationality || "—"}</div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <Languages className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.guests.preferredLanguage}</div>
                    <div className="mt-0.5 text-sm text-slate-900">{guest.preferredLanguage || "—"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="ID Status" />
            <CardContent>
              <IDStatusForm guestId={guest.id} currentStatus={guest.documentStatus} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader title="Reservation History" />
            <div className="divide-y divide-slate-100">
              {guest.reservations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                    <CalendarDays className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900">No reservations</h3>
                  <p className="text-sm text-slate-500 mt-1">This guest doesn't have any bookings yet.</p>
                </div>
              ) : (
                guest.reservations.map((res) => (
                  <div key={res.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/reservations/${res.id}`} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                            {res.code}
                          </Link>
                          <Badge variant="neutral" className="text-xs">via {res.platform}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
                          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            {new Date(res.checkInDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {" - "}
                            {new Date(res.checkOutDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{res.property.name} <span className="text-slate-300 mx-1">&bull;</span> {res.room.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <Badge variant={
                        res.status === 'CONFIRMED' ? 'success' :
                        res.status === 'CHECKED_IN' ? 'info' :
                        res.status === 'CHECKED_OUT' ? 'neutral' :
                        res.status === 'CANCELLED' ? 'danger' :
                        'warning'
                      }>
                        {t.reservations[res.status as keyof typeof t.reservations] || res.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
