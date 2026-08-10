"use client";

import { useState } from "react";
import { createRoomAction } from "../actions";

export function RoomForm({ propertyId, onSuccess }: { propertyId: string, onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createRoomAction(formData);
      (document.getElementById("room-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
