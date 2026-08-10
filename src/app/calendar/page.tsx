import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

export default async function CalendarPage({ searchParams }: { searchParams: { roomId?: string, propertyId?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  const whereClause: any = {};
  if (searchParams.roomId) whereClause.roomId = searchParams.roomId;
  if (searchParams.propertyId) whereClause.propertyId = searchParams.propertyId;

  const reservations = await db.reservation.findMany({
    where: { ...whereClause, status: { not: 'CANCELLED' } },
    include: { room: true }
  });

  const blocks = await db.availabilityBlock.findMany({
    where: whereClause,
    include: { room: true }
  });
  
  const tasks = await db.task.findMany({
    where: { title: "Calendar Conflict", status: 'OPEN' },
    include: { reservation: true }
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-4 py-3 text-center text-sm font-medium text-slate-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-200 gap-px">
          {days.map((day, idx) => {
            // Find items for this day
            const dayRes = reservations.filter(r => day >= new Date(new Date(r.checkInDate).setHours(0,0,0,0)) && day < new Date(new Date(r.checkOutDate).setHours(0,0,0,0)));
            const dayBlocks = blocks.filter(b => day >= new Date(new Date(b.startDate).setHours(0,0,0,0)) && day < new Date(new Date(b.endDate).setHours(0,0,0,0)));
            
            return (
              <div key={day.toISOString()} className="bg-white min-h-[120px] p-2" style={{ gridColumnStart: idx === 0 ? day.getDay() + 1 : 'auto' }}>
                <span className="text-sm font-medium text-slate-500">{format(day, 'd')}</span>
                <div className="mt-2 flex flex-col gap-1">
                  {dayRes.map(r => {
                    const isConflict = tasks.some(t => t.reservationId === r.id);
                    let color = "bg-blue-100 text-blue-800 border-blue-200";
                    if (isConflict) color = "bg-red-100 text-red-800 border-red-200";
                    else if (r.platform === 'AIRBNB') color = "bg-rose-100 text-rose-800 border-rose-200";
                    else if (r.platform === 'BOOKING') color = "bg-indigo-100 text-indigo-800 border-indigo-200";

                    return (
                      <div key={r.id} className={`text-xs px-2 py-1 rounded border ${color} truncate`} title={`${r.room.name}: ${r.platform} ${isConflict ? '(CONFLICT)' : ''}`}>
                        {r.room.name}: {r.platform} {isConflict && '⚠️'}
                      </div>
                    );
                  })}
                  {dayBlocks.map(b => (
                    <div key={b.id} className="text-xs px-2 py-1 rounded border bg-slate-100 text-slate-800 border-slate-200 truncate" title={`${b.room.name}: Blocked`}>
                      {b.room.name}: Blocked
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
