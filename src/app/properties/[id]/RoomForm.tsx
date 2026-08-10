"use client";

import { useState } from "react";
import { createRoomAction, probeAirbnbConnectionAction } from "../actions";

export function RoomForm({ propertyId, onSuccess }: { propertyId: string, onSuccess?: () => void }) {
  const [mode, setMode] = useState<"manual" | "airbnb">("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Airbnb State
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [roomName, setRoomName] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      if (mode === "airbnb" && preview) {
        formData.set("name", roomName);
        formData.set("airbnbIcalUrl", airbnbUrl);
        if (preview.listingId) formData.set("airbnbListingId", preview.listingId);
        if (preview.calendarName) formData.set("airbnbCalendarName", preview.calendarName);
      }
      
      await createRoomAction(formData);
      (document.getElementById("room-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const res = await probeAirbnbConnectionAction(airbnbUrl);
      if (!res.healthy) {
        throw new Error(res.error || "Failed to connect");
      }
      setPreview(res);
      setRoomName(res.calendarName || "");
    } catch (e: any) {
      setError(e.message || "Invalid Airbnb Calendar URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`pb-2 px-4 text-sm font-medium ${mode === "manual" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => { setMode("manual"); setError(""); }}
        >
          Manual
        </button>
        <button
          type="button"
          className={`pb-2 px-4 text-sm font-medium ${mode === "airbnb" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => { setMode("airbnb"); setError(""); }}
        >
          Import from Airbnb
        </button>
      </div>

      {mode === "manual" && (
        <form id="room-form" action={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <input type="hidden" name="propertyId" value={propertyId} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Name</label>
            <input type="text" name="name" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g. Room 101 or Main Bedroom" />
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? "Adding..." : "Add Room"}
          </button>
        </form>
      )}

      {mode === "airbnb" && (
        <div className="space-y-4">
          {!preview ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Connect an Airbnb listing using its exported calendar link.</p>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Airbnb Calendar URL</label>
                <input 
                  type="url" 
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  required 
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                  placeholder="https://www.airbnb.com/calendar/ical/..." 
                />
              </div>
              <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={loading || !airbnbUrl} 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test Connection"}
              </button>
            </div>
          ) : (
            <form id="room-form" action={handleSubmit} className="space-y-4">
              <input type="hidden" name="propertyId" value={propertyId} />
              
              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-sm">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                  ✓ Airbnb Calendar Connected
                </div>
                <div className="grid grid-cols-2 gap-2 text-green-700 mt-2">
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Listing ID</span>
                    <span>{preview.listingId || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Calendar Name</span>
                    <span>{preview.calendarName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Upcoming Events</span>
                    <span>{preview.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Next Reserved Period</span>
                    <span>{preview.nextReservedPeriod || "None"}</span>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required 
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                  placeholder="Enter a room name" 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setPreview(null)}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
