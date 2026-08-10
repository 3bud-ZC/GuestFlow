import { propertyService } from "@/lib/services/property";
import { roomService } from "@/lib/services/room";
import { guestService } from "@/lib/services/guest";
import { CreateReservationForm } from "./CreateReservationForm";
import { Card, CardContent } from "@/components/ui/Card";
import { BookOpen } from "lucide-react";

export default async function CreateReservationPage() {
  const properties = await propertyService.getProperties();
  const rooms = await roomService.getAllRooms();
  const guests = await guestService.getGuests();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Reservation</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create a new booking. You can select an existing guest or add a new one inline.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CreateReservationForm properties={properties} rooms={rooms} guests={guests} />
        </CardContent>
      </Card>
    </div>
  );
}
