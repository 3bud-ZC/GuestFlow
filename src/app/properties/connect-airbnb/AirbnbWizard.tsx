"use client";

import { useState, useEffect } from "react";
import { getPropertiesAndRooms, probeAirbnbUrl, connectExistingRoom, connectNewRoom } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, ChevronDown, ChevronRight, HelpCircle, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

import { useRouter } from "next/navigation";

export function AirbnbWizard() {
  const router = useRouter();
  const t = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"existing" | "new" | null>(null);
  
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  
  const [showHelp, setShowHelp] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (step === 2) {
      let isMounted = true;
      Promise.resolve().then(() => {
        if (isMounted) setLoadingProps(true);
      });
      getPropertiesAndRooms().then((data) => {
        if (isMounted) {
          setProperties(data);
          if (data.length > 0) setSelectedPropertyId(data[0].id);
          setLoadingProps(false);
        }
      }).catch(() => {
        if (isMounted) {
          setLoadingProps(false);
          setError("Failed to load properties. Please refresh the page.");
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [step]);

  const handleNext = () => {
    if (mode) setStep(2);
  };

  const handleTestConnection = async () => {
    if (!icalUrl.trim()) return;
    setError("");
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await probeAirbnbUrl(icalUrl.trim());
      if (!res.healthy) {
        // Show localized error if available
        setError(res.error || "Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
      } else {
        setProbeResult(res);
        setStep(3);
      }
    } catch (e: any) {
      setError(e.message || "Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.");
    } finally {
      setProbing(false);
    }
  };

  const handleConnect = async () => {
    setError("");
    setConnecting(true);
    try {
      if (mode === "existing") {
        if (!selectedRoomId) {
          setError("Please select a room to connect.");
          setConnecting(false);
          return;
        }
        await connectExistingRoom(selectedRoomId, icalUrl.trim());
      } else {
        if (!roomName.trim()) {
          setError("Please enter a room name.");
          setConnecting(false);
          return;
        }
        await connectNewRoom(selectedPropertyId, roomName.trim(), icalUrl.trim());
      }
      // Navigate to the property page
      router.push(`/properties/${selectedPropertyId}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Failed to connect calendar. Please try again.");
      setConnecting(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Validate if test connection button should be enabled
  const canTest = !!icalUrl.trim() && (mode === "existing" ? !!selectedRoomId : !!roomName.trim());

  return (
    <Card>
      <CardContent className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">{t.airbnb.step1Title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`p-4 border rounded-xl text-left transition-colors ${mode === "existing" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
              >
                <div className="font-medium text-slate-900 mb-1">{t.airbnb.existingRoom}</div>
                <div className="text-sm text-slate-500">{t.airbnb.connectExistingRoomDesc}</div>
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`p-4 border rounded-xl text-left transition-colors ${mode === "new" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
              >
                <div className="font-medium text-slate-900 mb-1">{t.airbnb.newRoom}</div>
                <div className="text-sm text-slate-500">{t.airbnb.connectNewRoomDesc}</div>
              </button>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!mode}>{t.airbnb.nextStep} <ChevronRight className="w-4 h-4 rtl:rotate-180 ml-1 rtl:ml-0 rtl:mr-1" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">{t.airbnb.step2Title}</h2>
            
            {loadingProps ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.airbnb.selectProperty}</label>
                  <select 
                    value={selectedPropertyId} 
                    onChange={e => {
                      setSelectedPropertyId(e.target.value);
                      setSelectedRoomId("");
                    }}
                    className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {properties.length === 0 && (
                      <option value="">No properties found — add a property first</option>
                    )}
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {mode === "existing" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.airbnb.selectRoom}</label>
                    <select 
                      value={selectedRoomId} 
                      onChange={e => setSelectedRoomId(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">{t.airbnb.chooseRoom}</option>
                      {selectedProperty?.rooms.map((r: any) => (
                        <option key={r.id} value={r.id} disabled={!!r.airbnbIcalUrl}>{r.name} {r.airbnbIcalUrl ? t.airbnb.alreadyConnected : ""}</option>
                      ))}
                    </select>
                    {selectedProperty?.rooms.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">No rooms in this property. Switch to "New Room" mode to create one.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.airbnb.newRoomName}</label>
                    <input 
                      type="text" 
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={t.airbnb.newRoomPlaceholder}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.airbnb.airbnbCalendarLink}</label>
                  <input 
                    type="url" 
                    value={icalUrl}
                    onChange={e => {
                      setIcalUrl(e.target.value);
                      setError(""); // Clear error when URL changes
                    }}
                    className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500 text-left ltr"
                    placeholder={t.airbnb.airbnbCalendarLinkPlaceholder}
                    dir="ltr"
                  />
                  
                  <div className="mt-2 border rounded-lg bg-slate-50 overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setShowHelp(!showHelp)}
                      className="w-full px-3 py-2 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      {t.airbnb.whereDoIGetThisLink}
                      {showHelp ? <ChevronDown className="w-4 h-4 ltr:ml-auto rtl:mr-auto" /> : <ChevronRight className="w-4 h-4 ltr:ml-auto rtl:mr-auto rtl:rotate-180" />}
                    </button>
                    {showHelp && (
                      <div className="p-3 text-sm text-slate-600 border-t border-slate-200 bg-white">
                        <ol className="list-decimal ltr:pl-4 rtl:pr-4 space-y-1">
                          <li>{t.airbnb.helpStep1}</li>
                          <li>{t.airbnb.helpStep2}</li>
                          <li>{t.airbnb.helpStep3}</li>
                          <li>{t.airbnb.helpStep4}</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => { setStep(1); setError(""); }}>{t.airbnb.back}</Button>
                  <Button 
                    type="button" 
                    onClick={handleTestConnection} 
                    disabled={probing || !canTest}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {probing ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-1" />{t.airbnb.testing}</>
                    ) : (
                      <>{t.airbnb.testConnection} <ChevronRight className="w-4 h-4 rtl:rotate-180 ml-1 rtl:ml-0 rtl:mr-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && probeResult && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">{t.airbnb.step3Title}</h2>
            
            <div className="max-w-xl">
              <div className="bg-green-50 p-5 rounded-lg border border-green-200 mb-6">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-4 text-lg">
                  <CheckCircle2 className="w-5 h-5" /> {t.airbnb.airbnbConnectedSuccessfully}
                </div>
                <div className="grid grid-cols-2 gap-4 text-green-700">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">{t.airbnb.listingId}</span>
                    <span className="font-medium text-sm" dir="ltr">{probeResult.listingId || t.airbnb.unknown}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">{t.airbnb.calendarName}</span>
                    <span className="font-medium text-sm">{probeResult.calendarName || t.airbnb.notProvided}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Upcoming Events</span>
                    <span className="font-medium text-sm">{probeResult.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Next Reserved Period</span>
                    <span className="font-medium text-sm">{probeResult.nextReservedPeriod || t.airbnb.none}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => { setStep(2); setError(""); }}>{t.airbnb.back}</Button>
                <Button 
                  type="button" 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" />{t.airbnb.connecting}</>
                  ) : t.airbnb.connectRoom}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
