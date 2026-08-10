import { propertyService } from "@/lib/services/property";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { AddRoomDrawer } from "./AddRoomDrawer";
import { RoomRow } from "./RoomRow";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Building2, MapPin, DoorClosed } from "lucide-react";

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, user] = await Promise.all([
    propertyService.getPropertyById(id),
    getCurrentUser(),
  ]);

  if (!property) notFound();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/properties" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Properties
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{property.name}</h1>
              {property.address && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {property.address}
                </p>
              )}
            </div>
          </div>
        </div>
        {isAdmin && <AddRoomDrawer propertyId={property.id} />}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Rooms" />
            <div className="divide-y divide-slate-100">
              {property.rooms.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                    <DoorClosed className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900">No rooms added</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {isAdmin ? "Add your first room using the form." : "There are currently no rooms for this property."}
                  </p>
                </div>
              ) : (
                property.rooms.map((room) => (
                  <RoomRow key={room.id} room={{...room, airbnbIcalUrl: !!room.airbnbIcalUrl as any}} isAdmin={isAdmin} propertyId={property.id} />
                ))
              )}
            </div>
            {isAdmin && property.rooms.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <Link href="/properties/connect-airbnb">
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      Go to Airbnb Wizard
                    </Button>
                 </Link>
              </div>
            )}
          </Card>
        </div>
    </div>
  );
}
