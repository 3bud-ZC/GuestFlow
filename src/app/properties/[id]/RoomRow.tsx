"use client";

import { DoorClosed, RefreshCw, Unplug, AlertTriangle, CheckCircle2, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { syncAirbnbAction, disconnectAirbnbAction, connectAirbnbAction, probeAirbnbConnectionAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function RoomRow({ room, isAdmin, propertyId }: { room: any, isAdmin: boolean, propertyId: string }) {
  const { t, locale } = useLocale();
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function localizedError(res: { error: string; errorAr: string }) {
    return locale === "ar" ? res.errorAr : res.error;
  }

  async function handleSync() {
    setSyncing(true);
    setError("");
    try {
      const res: any = await syncAirbnbAction(room.id, propertyId);
      if (res && res.success && res.summary) {
        const s = res.summary;
        setSyncResult(`Sync complete! New: ${s.importedReservations}, Updated: ${s.updated}, Cancelled: ${s.cancelledReservations}, Blocks: ${s.importedBlocks}, Conflicts: ${s.conflicts}`);
      } else if (res && !res.success) {
        setError(localizedError(res));
      }
    } catch (e: any) {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(t.airbnb.confirmDisconnect)) return;
    setDisconnecting(true);
    setError("");
    try {
      const res = await disconnectAirbnbAction(room.id, propertyId);
      if (res && !res.success) {
        setError(localizedError(res));
      }
    } catch (e: any) {
      setError("Disconnect failed");
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
        setError((locale === "ar" ? res.errorAr : res.error) || "Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
        return;
      }
      setPreview(res);
    } catch (e: any) {
      setError("Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      formData.set("airbnbIcalUrl", airbnbUrl);

      const res: any = await connectAirbnbAction(room.id, propertyId, formData);
      if (res && !res.success) {
        setError(localizedError(res));
        return;
      }
      setIsConnecting(false);
      setPreview(null);
      setAirbnbUrl("");
    } catch (e: any) {
      setError("Failed to connect calendar");
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
                  {t.airbnb.connected}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">{t.airbnb.listingId}: {room.airbnbListingId || t.airbnb.unknown}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">
                  {t.airbnb.lastSync}: {room.airbnbLastSyncedAt ? new Date(room.airbnbLastSyncedAt).toLocaleString('en-US', { timeZone: 'UTC' }) : t.airbnb.none}
                </span>
                {!isHealthy && (
                  <span className="text-red-600 ml-1 block w-full mt-1">{t.common.error}: {room.airbnbLastSyncError}</span>
                )}
                {syncResult && (
                  <span className="text-green-600 ml-1 block w-full mt-1">{syncResult}</span>
                )}
              </div>
            )}
            {!isConnected && (
              <div className="text-xs text-slate-500 mt-1">{t.airbnb.notConnectedToAirbnb}</div>
            )}
            {error && !isConnecting && (
              <div className="text-xs text-red-600 mt-1">{error}</div>
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
                  {syncing ? t.airbnb.syncing : t.airbnb.syncNow}
                </Button>
                <Button href={`/calendar?roomId=${room.id}`} variant="outline" size="sm">
                  {t.airbnb.viewCalendar}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={syncing || disconnecting}
                  icon={<Unplug className="w-3 h-3 text-red-500" />}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  {disconnecting ? t.airbnb.disconnecting : t.airbnb.disconnect}
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
                {isConnecting ? t.airbnb.cancel : t.airbnb.connectAirbnb}
              </Button>
            )}
          </div>
        )}
      </div>

      {isConnecting && !isConnected && (
        <div className="px-5 pb-5 border-t border-slate-100 mt-2 pt-4 bg-slate-50/50">
          {!preview ? (
            <div className="max-w-xl">
              <p className="text-sm text-slate-500 mb-4">{t.airbnb.linkCalendarHelp}</p>
              {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.airbnb.airbnbCalendarLink}</label>
                <input
                  type="url"
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  required
                  dir="ltr"
                  className="block w-full rounded border-slate-300 shadow-sm p-2 text-sm border focus:border-blue-500 focus:ring-blue-500 bg-white text-left"
                  placeholder={t.airbnb.airbnbCalendarLinkPlaceholder}
                />
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={loading || !airbnbUrl}
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? t.airbnb.testing : t.airbnb.testConnection}
              </Button>
            </div>
          ) : (
            <form action={handleConnectSubmit} className="max-w-xl">
              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-sm mb-4">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> {t.airbnb.airbnbCalendarValid}
                </div>
                <div className="grid grid-cols-2 gap-3 text-green-700 mt-2">
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.listingId}</span>
                    <span className="font-medium">{preview.listingId || t.airbnb.unknown}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.calendarName}</span>
                    <span className="font-medium">{preview.calendarName || t.airbnb.notProvided}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.upcomingEvents}</span>
                    <span className="font-medium">{preview.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.nextReservedPeriod}</span>
                    <span className="font-medium">{preview.nextReservedPeriod || t.airbnb.none}</span>
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
                  {t.airbnb.back}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? t.airbnb.connecting : t.airbnb.confirmConnection}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
