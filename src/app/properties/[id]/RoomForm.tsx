"use client";

import { useState } from "react";
import { createRoomAction, probeAirbnbConnectionAction } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function RoomForm({ propertyId, onSuccess }: { propertyId: string, onSuccess?: () => void }) {
  const { t, locale } = useLocale();
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
      }

      const res: any = await createRoomAction(formData);
      if (res && !res.success) {
        setError(locale === "ar" ? res.errorAr : res.error);
        return;
      }
      (document.getElementById("room-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError("Failed to create room");
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
        setError((locale === "ar" ? res.errorAr : res.error) || "Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
        return;
      }
      setPreview(res);
      setRoomName(res.calendarName || "");
    } catch (e: any) {
      setError("Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
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
          {t.airbnb.manual}
        </button>
        <button
          type="button"
          className={`pb-2 px-4 text-sm font-medium ${mode === "airbnb" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => { setMode("airbnb"); setError(""); }}
        >
          {t.airbnb.importFromAirbnb}
        </button>
      </div>

      {mode === "manual" && (
        <form id="room-form" action={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <input type="hidden" name="propertyId" value={propertyId} />

          <div>
            <label className="block text-sm font-medium text-gray-700">{t.airbnb.roomName}</label>
            <input type="text" name="name" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder={t.airbnb.roomNamePlaceholder} />
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? t.airbnb.adding : t.airbnb.addRoom}
          </button>
        </form>
      )}

      {mode === "airbnb" && (
        <div className="space-y-4">
          {!preview ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{t.airbnb.linkCalendarHelp}</p>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.airbnb.airbnbCalendarLink}</label>
                <input
                  type="url"
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  required
                  dir="ltr"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-left"
                  placeholder={t.airbnb.airbnbCalendarLinkPlaceholder}
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={loading || !airbnbUrl}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? t.airbnb.testing : t.airbnb.testConnection}
              </button>
            </div>
          ) : (
            <form id="room-form" action={handleSubmit} className="space-y-4">
              <input type="hidden" name="propertyId" value={propertyId} />

              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-sm">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                  ✓ {t.airbnb.airbnbCalendarValid}
                </div>
                <div className="grid grid-cols-2 gap-2 text-green-700 mt-2">
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.listingId}</span>
                    <span>{preview.listingId || t.airbnb.unknown}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.calendarName}</span>
                    <span>{preview.calendarName || t.airbnb.notProvided}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.upcomingEvents}</span>
                    <span>{preview.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase opacity-80">{t.airbnb.nextReservedPeriod}</span>
                    <span>{preview.nextReservedPeriod || t.airbnb.none}</span>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.airbnb.roomName}</label>
                <input
                  type="text"
                  name="name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={t.airbnb.roomName}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t.airbnb.back}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? t.airbnb.creating : t.airbnb.createRoom}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
