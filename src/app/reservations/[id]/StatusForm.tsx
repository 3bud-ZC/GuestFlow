"use client";

import { useState } from "react";
import { updateReservationStatusAction } from "../actions";
import { ReservationStatus, GuestDocumentStatus } from "@prisma/client";

export function StatusForm({ 
  reservationId, 
  currentStatus, 
  guestDocumentStatus 
}: { 
  reservationId: string, 
  currentStatus: ReservationStatus,
  guestDocumentStatus: GuestDocumentStatus
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(newStatus: ReservationStatus) {
    setLoading(true);
    setError("");
    try {
      await updateReservationStatusAction(reservationId, newStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  const isCheckInAvailable = currentStatus === 'CONFIRMED';
  const isCheckOutAvailable = currentStatus === 'CHECKED_IN';
  const showIdWarning = isCheckInAvailable && guestDocumentStatus === 'PENDING';

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-sm text-red-700 rounded border border-red-200">{error}</div>}
      
      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
          currentStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
          currentStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
          currentStatus === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {currentStatus}
        </span>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Operations</h3>
        
        {isCheckInAvailable && (
          <div className="space-y-3">
            {showIdWarning && (
              <div className="p-3 bg-yellow-50 text-sm text-yellow-800 rounded border border-yellow-200 font-medium">
                Warning: Guest ID is still marked as pending.
              </div>
            )}
            <button 
              onClick={() => handleStatusChange('CHECKED_IN')}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "CHECK IN GUEST"}
            </button>
          </div>
        )}

        {isCheckOutAvailable && (
          <button 
            onClick={() => handleStatusChange('CHECKED_OUT')}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "CHECK OUT GUEST"}
          </button>
        )}

        {!isCheckInAvailable && !isCheckOutAvailable && (
          <p className="text-sm text-gray-500">No primary operations available for current state.</p>
        )}
      </div>
    </div>
  );
}
