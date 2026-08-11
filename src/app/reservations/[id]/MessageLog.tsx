"use client";

import { MessageType, MessageStatus, ReservationStatus } from "@prisma/client";
import { useState } from "react";
import { sendManualMessageAction } from "./messageActions";

export function MessageLog({ 
  reservationId, 
  messages,
  reservationStatus
}: { 
  reservationId: string, 
  messages: any[],
  reservationStatus: ReservationStatus
}) {
  const [loadingType, setLoadingType] = useState<MessageType | null>(null);
  const [error, setError] = useState("");

  const handleSend = async (type: MessageType) => {
    setLoadingType(type);
    setError("");
    try {
      await sendManualMessageAction(reservationId, type);
    } catch (e: any) {
      setError(e.message || "Failed to send message");
    } finally {
      setLoadingType(null);
    }
  };

  const getRecommendedActions = (): MessageType[] => {
    switch (reservationStatus) {
      case 'CONFIRMED':
        return [MessageType.WELCOME, MessageType.ID_REMINDER, MessageType.LOCATION];
      case 'CHECKED_IN':
        return [MessageType.CHECKIN_WELCOME, MessageType.CHECKOUT_REMINDER];
      case 'CHECKED_OUT':
        return [MessageType.REVIEW_REQUEST];
      default:
        return [];
    }
  };

  const recommended = getRecommendedActions();
  const others = Object.values(MessageType).filter(t => !recommended.includes(t as MessageType));

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-sm text-red-700 rounded border border-red-200">{error}</div>}
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recommended Actions</h3>
        <div className="flex flex-wrap gap-2">
          {recommended.map(type => (
            <button
              key={type}
              onClick={() => handleSend(type)}
              disabled={loadingType !== null}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingType === type ? "Sending..." : `Send ${type}`}
            </button>
          ))}
          {recommended.length === 0 && <p className="text-sm text-gray-500">None for current state.</p>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Other Actions</h3>
        <div className="flex flex-wrap gap-2">
          {others.map(type => (
            <button
              key={type}
              onClick={() => handleSend(type)}
              disabled={loadingType !== null}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingType === type ? "Sending..." : `Send ${type}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Message History</h3>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages sent yet.</p>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-900">{msg.type}</span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ' ? 'bg-green-100 text-green-800' :
                    msg.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {msg.status === 'SCHEDULED' && msg.scheduledAt ? (
                    <span>Scheduled for {new Date(msg.scheduledAt).toLocaleString('en-US', { timeZone: 'UTC' })}</span>
                  ) : (
                    <span>{new Date(msg.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}</span>
                  )}
                </div>
                {msg.status === 'FAILED' && msg.errorInfo && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    Error: {msg.errorInfo}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
