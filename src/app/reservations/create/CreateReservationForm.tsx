"use client";

import { useState } from "react";
import { createReservationAction } from "../actions";
import { ReservationPlatform } from "@prisma/client";

export function CreateReservationForm({ properties, rooms, guests }: { properties: any[], rooms: any[], guests: any[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    formData.append("isNewGuest", isNewGuest.toString());
    
    try {
      await createReservationAction(formData);
      // Navigation happens in the action via redirect()
    } catch (e: any) {
      setError(e.message || "Failed to create reservation");
      setLoading(false);
    }
  }

  const availableRooms = rooms.filter(r => r.propertyId === selectedProperty);

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}
      
      <div className="space-y-8">
        {/* Step 1: Booking Source */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Booking Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Reservation Code</label>
              <input type="text" name="code" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="e.g. HMAXYZ123" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Platform</label>
              <select name="platform" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm">
                {Object.values(ReservationPlatform).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Guest Information */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">2. Guest Information</h3>
            <label className="flex items-center text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
              <input type="checkbox" checked={isNewGuest} onChange={e => setIsNewGuest(e.target.checked)} className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
              Create new guest
            </label>
          </div>

          {isNewGuest ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700">First Name</label>
                <input type="text" name="guestFirstName" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Last Name</label>
                <input type="text" name="guestLastName" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email (Optional)</label>
                <input type="email" name="guestEmail" className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone (Optional)</label>
                <input type="tel" name="guestPhone" className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-white" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700">Select Existing Guest</label>
              <select name="guestId" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2.5 border focus:border-blue-500 focus:ring-blue-500 text-sm">
                <option value="">-- Choose a Guest --</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName} {g.email || g.phone ? `(${g.email || g.phone})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 3: Stay Details */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">3. Stay Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Property</label>
              <select 
                name="propertyId" 
                required 
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Choose a Property --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Room</label>
              <select name="roomId" required disabled={!selectedProperty} className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                <option value="">-- Choose a Room --</option>
                {availableRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Check-in Date</label>
              <input type="date" name="checkInDate" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Check-out Date</label>
              <input type="date" name="checkOutDate" required className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Number of Guests</label>
              <input type="number" name="numberOfGuests" min="1" required defaultValue="1" className="mt-1.5 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
            {loading ? "Creating Reservation..." : "Create Reservation"}
          </button>
        </div>
      </div>
    </form>
  );
}
