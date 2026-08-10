import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday } from "date-fns";
import { calendarService } from "@/lib/services/calendar";
import { propertyService } from "@/lib/services/property";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function CalendarPage({
  searchParams
}: {
  searchParams: { month?: string, year?: string, propertyId?: string, roomId?: string }
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentDate = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : currentDate.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) - 1 : currentDate.getMonth(); // 0-indexed
  
  const displayDate = new Date(year, month, 1);
  const startMonth = startOfMonth(displayDate);
  const endMonth = endOfMonth(displayDate);
  const calendarStart = startOfWeek(startMonth);
  const calendarEnd = endOfWeek(endMonth);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const { propertyId, roomId } = searchParams;
  
  const properties = await propertyService.getProperties();
  const rooms = propertyId ? properties.find(p => p.id === propertyId)?.rooms || [] : [];
  
  const calendarData = await calendarService.getCalendarData(
    calendarStart,
    calendarEnd,
    propertyId,
    roomId
  );

  const prevMonth = subMonths(displayDate, 1);
  const nextMonth = addMonths(displayDate, 1);
  
  const createNavUrl = (date: Date) => {
    const params = new URLSearchParams(searchParams as any);
    params.set("month", (date.getMonth() + 1).toString());
    params.set("year", date.getFullYear().toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">{format(displayDate, 'MMMM yyyy')}</h1>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
            <Link href={createNavUrl(prevMonth)} className="p-2 hover:bg-slate-50 border-r border-slate-200">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <Link href={`/calendar`} className="px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Today
            </Link>
            <Link href={createNavUrl(nextMonth)} className="p-2 hover:bg-slate-50 border-l border-slate-200">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </Link>
          </div>
        </div>
        
        <form className="flex gap-3">
          <input type="hidden" name="month" value={month + 1} />
          <input type="hidden" name="year" value={year} />
          <select 
            name="propertyId" 
            defaultValue={propertyId || ""} 
            className="block w-full py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {propertyId && rooms.length > 0 && (
            <select 
              name="roomId" 
              defaultValue={roomId || ""}
              className="block w-full py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Rooms</option>
              {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Filter</button>
        </form>
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
          {days.map((day) => {
            const dayRes = calendarData.reservations.filter((r: any) => day >= new Date(new Date(r.checkInDate).setHours(0,0,0,0)) && day < new Date(new Date(r.checkOutDate).setHours(0,0,0,0)));
            const dayBlocks = calendarData.availabilityBlocks.filter((b: any) => day >= new Date(new Date(b.startDate).setHours(0,0,0,0)) && day < new Date(new Date(b.endDate).setHours(0,0,0,0)));
            const isCurrentMonth = isSameMonth(day, displayDate);
            const isTodayDate = isToday(day);
            
            return (
              <div key={day.toISOString()} className={`bg-white min-h-[120px] p-2 ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''}`}>
                <span className={`text-sm font-medium inline-block w-7 h-7 text-center leading-7 rounded-full ${isTodayDate ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-2 flex flex-col gap-1">
                  {dayRes.map((r: any) => {
                    let color = "bg-blue-100 text-blue-800 border-blue-200";
                    if (r.platform === 'AIRBNB') color = "bg-rose-100 text-rose-800 border-rose-200";
                    else if (r.platform === 'BOOKING') color = "bg-indigo-100 text-indigo-800 border-indigo-200";

                    return (
                      <div key={r.id} className={`text-xs px-2 py-1 rounded border ${color} truncate cursor-pointer hover:opacity-80 transition-opacity`} title={`Room ${r.roomId}: ${r.platform}`}>
                        Room {r.roomId}: {r.platform}
                      </div>
                    );
                  })}
                  {dayBlocks.map((b: any) => (
                    <div key={b.id} className="text-xs px-2 py-1 rounded border bg-slate-100 text-slate-800 border-slate-200 truncate" title={`Room ${b.roomId}: Blocked`}>
                      Room {b.roomId}: Blocked
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
