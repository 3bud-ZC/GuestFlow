"use client";

import { useState } from "react";
import { updatePropertyAction } from "../actions";

type Property = {
  id: string;
  name: string;
  address: string | null;
  googleMapsUrl: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
};

export function EditPropertyForm({ property }: { property: Property }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await updatePropertyAction(property.id, formData);
      setEditing(false);
    } catch (e: any) {
      setError(e.message || "Failed to update property");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 w-full">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-xs font-medium text-slate-700">Property Name</label>
        <input type="text" name="name" defaultValue={property.name} required className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Address</label>
        <input type="text" name="address" defaultValue={property.address || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Google Maps URL</label>
        <input type="url" name="googleMapsUrl" defaultValue={property.googleMapsUrl || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Wi-Fi Name</label>
        <input type="text" name="wifiName" defaultValue={property.wifiName || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Wi-Fi Password</label>
        <input type="text" name="wifiPassword" defaultValue={property.wifiPassword || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 px-3 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 border border-transparent rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
