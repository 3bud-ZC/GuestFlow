"use client";

import { useState } from "react";
import { createPropertyAction } from "./actions";

export function PropertyForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createPropertyAction(formData);
      (document.getElementById("property-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create property");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="property-form" action={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Property Name</label>
        <input type="text" name="name" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g. Sunny Villa" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
        <input type="text" name="address" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Google Maps URL (Optional)</label>
        <input type="url" name="googleMapsUrl" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Wi-Fi Name (Optional)</label>
        <input type="text" name="wifiName" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Wi-Fi Password (Optional)</label>
        <input type="text" name="wifiPassword" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
        {loading ? "Creating..." : "Create Property"}
      </button>
    </form>
  );
}
