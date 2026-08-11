"use client";

import { useState } from "react";
import { updateGuestDocumentStatusAction } from "../actions";
import { GuestDocumentStatus } from "@prisma/client";

export function IDStatusForm({ guestId, currentStatus }: { guestId: string, currentStatus: GuestDocumentStatus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    setError("");
    try {
      await updateGuestDocumentStatusAction(guestId, e.target.value as GuestDocumentStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update ID status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 font-medium ${
          currentStatus === 'RECEIVED' ? 'bg-green-50 text-green-800 border-green-200' :
          currentStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
          'bg-gray-50 text-gray-800'
        }`}
      >
        <option value="PENDING">Pending</option>
        <option value="RECEIVED">Received</option>
        <option value="NOT_REQUIRED">Not Required</option>
      </select>
      {loading && <div className="text-xs text-gray-500 mt-1">Updating...</div>}
    </div>
  );
}
