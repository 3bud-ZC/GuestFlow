"use client";

import { DoorClosed, RefreshCw, Unplug, AlertTriangle, CheckCircle2, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { syncAirbnbAction, disconnectAirbnbAction, connectAirbnbAction, probeAirbnbConnectionAction } from "../actions";
import { Button } from "@/components/ui/Button";

export function RoomRow({ room, isAdmin, propertyId }: { room: any, isAdmin: boolean, propertyId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    } catch (e: any) {
      setError(e.message || "Invalid Airbnb Calendar URL");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      formData.set("airbnbIcalUrl", airbnbUrl);
      
      await connectAirbnbAction(room.id, propertyId, formData);
      setIsConnecting(false);
      setPreview(null);
      setAirbnbUrl("");
    } catch (e: any) {
      setError(e.message || "Failed to connect calendar");
    } finally {
      setLoading(false);
    }
  }

  const isConnected = !!room.airbnbIcalUrl;
  const isHealthy = isConnected && !room.airbnbLastSyncError;

  return (
    <div className="flex flex-col hover:bg-slate-50/50 transition-colors">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
            {!isConnected && (
              <div className="text-xs text-slate-500 mt-1">Not connected to Airbnb</div>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {isConnected ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSync} 
                  disabled={syncing || disconnecting}
                  icon={<RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />}
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button href={`/calendar?roomId=${room.id}`} variant="outline" size="sm">
                  View Calendar
                </Button>
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
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsConnecting(!isConnecting);
                  setError("");
                  setPreview(null);
                  setAirbnbUrl("");
                }}
                icon={isConnecting ? <ChevronUp className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                className={isConnecting ? "bg-slate-100" : ""}
              >
                {isConnecting ? "Cancel" : "Connect Airbnb"}
              </Button>
            )}
          </div>
        )}
      </div>

      {isConnecting && !isConnected && (
        <div className="px-5 pb-5 border-t border-slate-100 mt-2 pt-4 bg-slate-50/50">
          {!preview ? (
            <div className="max-w-xl">
              <p className="text-sm text-slate-500 mb-4">Connect an Airbnb listing using its exported calendar link.</p>
              {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Airbnb Calendar URL</label>
                <input 
                  type="url" 
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  required 
                  className="block w-full rounded border-slate-300 shadow-sm p-2 text-sm border focus:border-blue-500 focus:ring-blue-500 bg-white" 
                  placeholder="https://www.airbnb.com/calendar/ical/..." 
                />
              </div>
              <Button 
                onClick={handleTestConnection}
                disabled={loading || !airbnbUrl}
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          ) : (
            <form action={handleConnectSubmit} className="max-w-xl">
              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-sm mb-4">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Airbnb Calendar Valid
                </div>
                <div className="grid grid-cols-2 gap-3 text-green-700 mt-2">
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Listing ID</span>
                    <span className="font-medium">{preview.listingId || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Calendar Name</span>
                    <span className="font-medium">{preview.calendarName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Upcoming Events</span>
                    <span className="font-medium">{preview.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">Next Reserved</span>
                    <span className="font-medium">{preview.nextReservedPeriod || "None"}</span>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded border border-red-100">{error}</div>}

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setPreview(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Connecting..." : "Confirm Connection"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
