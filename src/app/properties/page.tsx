import { propertyService } from "@/lib/services/property";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { AddPropertyDrawer } from "./AddPropertyDrawer";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, MapPin, ChevronRight, Plus, Link2, Settings } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function PropertiesPage() {
  const properties = await propertyService.getProperties();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const cookieStore = await cookies();
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.properties}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your properties and the rooms they contain.
          </p>
        </div>
        {isAdmin && <AddPropertyDrawer />}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
            {properties.map((property) => (
              <Card key={property.id} className="group hover:border-blue-200 transition-colors">
                <Link href={`/properties/${property.id}`} className="block p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {property.name}
                        </h3>
                        {property.address && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{property.address}</span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {property._count.rooms} {t.reservations.room}{property._count.rooms !== 1 && 's'}
                          </span>
                          {(property as any).rooms && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                              {(property as any).rooms.filter((r: any) => r.airbnbIcalUrl).length} Airbnb Connected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pt-2 flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {isAdmin && (
                          <Link href="/properties/connect-airbnb" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <Link2 className="w-4 h-4" />
                            {t.airbnb.connectAirbnb}
                          </Link>
                        )}
                        <Link href={`/properties/${property.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Settings className="w-4 h-4" />
                          {t.properties.manage}
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
            
            {properties.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900">{t.empty.noResults}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
