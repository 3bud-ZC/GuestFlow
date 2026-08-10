"use client";

import { useState, useEffect } from "react";
import { getPropertiesAndRooms, probeAirbnbUrl, connectExistingRoom, connectNewRoom } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, ChevronDown, ChevronRight, HelpCircle, Loader2 } from "lucide-react";

export function AirbnbWizard() {
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
      setLoadingProps(true);
      getPropertiesAndRooms().then((data) => {
        setProperties(data);
        if (data.length > 0) setSelectedPropertyId(data[0].id);
        setLoadingProps(false);
      });
    }
  }, [step]);

  const handleNext = () => {
    if (mode) setStep(2);
  };

  const handleTestConnection = async () => {
    if (!icalUrl) return;
    setError("");
    setProbing(true);
    try {
      const res = await probeAirbnbUrl(icalUrl);
      setProbeResult(res);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Invalid Airbnb Calendar URL");
    } finally {
      setProbing(false);
    }
  };

  const handleConnect = async () => {
    setError("");
    setConnecting(true);
    try {
      if (mode === "existing") {
        await connectExistingRoom(selectedRoomId, icalUrl);
      } else {
        await connectNewRoom(selectedPropertyId, roomName, icalUrl);
      }
      window.location.href = `/properties/${selectedPropertyId}`;
    } catch (e: any) {
      setError(e.message || "Failed to connect calendar");
      setConnecting(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <Card>
      <CardContent className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Step 1: Connection Type</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`p-4 border rounded-xl text-left transition-colors ${mode === "existing" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
              >
                <div className="font-medium text-slate-900 mb-1">Connect Existing Room</div>
                <div className="text-sm text-slate-500">Link an Airbnb calendar to a room you have already created in GuestFlow.</div>
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`p-4 border rounded-xl text-left transition-colors ${mode === "new" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
              >
                <div className="font-medium text-slate-900 mb-1">Connect New Room</div>
                <div className="text-sm text-slate-500">Create a new room in a property and link it to an Airbnb calendar at the same time.</div>
              </button>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!mode}>Next Step <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Step 2: Room Details & Link</h2>
            
            {loadingProps ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
                  <select 
                    value={selectedPropertyId} 
                    onChange={e => {
                      setSelectedPropertyId(e.target.value);
                      setSelectedRoomId("");
                    }}
                    className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {mode === "existing" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Room</label>
                    <select 
                      value={selectedRoomId} 
                      onChange={e => setSelectedRoomId(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">-- Choose a room --</option>
                      {selectedProperty?.rooms.map((r: any) => (
                        <option key={r.id} value={r.id} disabled={r.airbnbIcalUrl}>{r.name} {r.airbnbIcalUrl ? "(Already connected)" : ""}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Room Name</label>
                    <input 
                      type="text" 
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Suite 101"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Airbnb Calendar Link</label>
                  <input 
                    type="url" 
                    value={icalUrl}
                    onChange={e => setIcalUrl(e.target.value)}
                    className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                  />
                  
                  <div className="mt-2 border rounded-lg bg-slate-50 overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setShowHelp(!showHelp)}
                      className="w-full px-3 py-2 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Where do I get this link?
                      {showHelp ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                    {showHelp && (
                      <div className="p-3 text-sm text-slate-600 border-t border-slate-200 bg-white">
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Open your Airbnb listing settings</li>
                          <li>Go to <strong>Pricing and availability</strong> → <strong>Calendar sync</strong></li>
                          <li>Click <strong>Export calendar</strong> (or "Connect to another website")</li>
                          <li>Copy the provided Airbnb export calendar link</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    type="button" 
                    onClick={handleTestConnection} 
                    disabled={probing || !icalUrl || (mode === "existing" ? !selectedRoomId : !roomName)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {probing ? "Testing..." : "Test Connection"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && probeResult && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Step 3: Confirm Connection</h2>
            
            <div className="max-w-xl">
              <div className="bg-green-50 p-5 rounded-lg border border-green-200 mb-6">
                <div className="font-semibold text-green-800 flex items-center gap-2 mb-4 text-lg">
                  <CheckCircle2 className="w-5 h-5" /> Airbnb connected successfully
                </div>
                <div className="grid grid-cols-2 gap-4 text-green-700">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Listing ID</span>
                    <span className="font-medium text-sm">{probeResult.listingId || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Calendar Name</span>
                    <span className="font-medium text-sm">{probeResult.calendarName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Upcoming Events</span>
                    <span className="font-medium text-sm">{probeResult.eventCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Next Reserved Period</span>
                    <span className="font-medium text-sm">{probeResult.nextReservedPeriod || "None"}</span>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connecting ? "Connecting..." : "Connect Room"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
