"use client";

import { DoorClosed, RefreshCw, Unplug, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { syncAirbnbAction, disconnectAirbnbAction } from "../actions";
import { Button } from "@/components/ui/Button";

export function RoomRow({ room, isAdmin, propertyId }: { room: any, isAdmin: boolean, propertyId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await syncAirbnbAction(room.id, propertyId);
      if (res && res.success && res.summary) {
        const s = res.summary;
        alert(`Sync complete!\nNew Reservations: ${s.importedReservations}\nUpdated: ${s.updated}\nCancelled: ${s.cancelledReservations}\nBlocks: ${s.importedBlocks}\nRemoved Blocks: ${s.removedBlocks}\nConflicts: ${s.conflicts}\nUnchanged: ${s.unchanged}`);
      } else if (res && !res.success) {
        alert(res.error || "Sync failed");
      }
    } catch (e: any) {
      alert(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect this Airbnb calendar? Syncing will stop.")) return;
    setDisconnecting(true);
    try {
      await disconnectAirbnbAction(room.id, propertyId);
    } catch (e: any) {
      alert(e.message || "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = !!room.airbnbIcalUrl;
  const isHealthy = isConnected && !room.airbnbLastSyncError;

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-slate-50/50 transition-colors gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
          <DoorClosed className="w-5 h-5" />
        </div>
        <div>
          <span className="font-medium text-slate-900 block">{room.name}</span>
          {isConnected && (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className={`inline-flex items-center gap-1 font-medium ${isHealthy ? "text-green-700" : "text-red-700"}`}>
                {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                Airbnb Connected
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">ID: {room.airbnbListingId || "Unknown"}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">
                Sync: {room.airbnbLastSyncedAt ? new Date(room.airbnbLastSyncedAt).toLocaleString() : "Never"}
              </span>
              {!isHealthy && (
                <span className="text-red-600 ml-1 block w-full mt-1">Error: {room.airbnbLastSyncError}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isAdmin && isConnected && (
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync} 
            disabled={syncing || disconnecting}
            icon={<RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />}
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
          <a href={`/calendar?roomId=${room.id}`}>
            <Button variant="outline" size="sm">
              View Calendar
            </Button>
          </a>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            disabled={syncing || disconnecting}
            icon={<Unplug className="w-3 h-3 text-red-500" />}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
