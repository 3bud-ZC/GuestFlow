import { propertyService } from "@/lib/services/property";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { AddPropertyDrawer } from "./AddPropertyDrawer";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, MapPin, ChevronRight, Plus } from "lucide-react";

export default async function PropertiesPage() {
  const properties = await propertyService.getProperties();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Properties & Rooms</h1>
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
                            {property._count.rooms} room{property._count.rooms !== 1 && 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pt-2">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
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
                  <h3 className="text-sm font-medium text-slate-900">No properties found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {isAdmin ? "Add your first property using the form." : "Check back later."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
