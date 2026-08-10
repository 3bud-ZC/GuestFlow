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
  const [properties, user, cookieStore] = await Promise.all([
    propertyService.getProperties(),
    getCurrentUser(),
    cookies(),
  ]);

  const isAdmin = user?.role === "ADMIN";
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.properties}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.properties.managePropertiesAndRooms || "Manage your properties and the rooms they contain."}
          </p>
        </div>
        {isAdmin && <AddPropertyDrawer />}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="p-5 sm:p-6 hover:border-blue-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Link
                    href={`/properties/${property.id}`}
                    className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Building2 className="w-6 h-6" />
                  </Link>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      <Link href={`/properties/${property.id}`} className="hover:text-blue-700 transition-colors">
                        {property.name}
                      </Link>
                    </h3>
                    {property.address && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{property.address}</span>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {property._count.rooms} {t.reservations.room}{property._count.rooms !== 1 && 's'}
                      </span>
                      {property.airbnbConnectedCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {property.airbnbConnectedCount} {t.properties.roomsConnected || 'Airbnb Connected'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-2 flex flex-col sm:items-end gap-2">
                  <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                      <Link
                        href="/properties/connect-airbnb"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Link2 className="w-4 h-4" />
                        {t.airbnb.connectAirbnb}
                      </Link>
                    )}
                    <Link
                      href={`/properties/${property.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t.properties.manage}
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {properties.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">{t.empty.noResults}</h3>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
