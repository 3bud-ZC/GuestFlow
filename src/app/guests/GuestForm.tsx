"use client";

import { useState } from "react";
import { createGuestAction } from "./actions";

export function GuestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createGuestAction(formData);
      (document.getElementById("guest-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create guest");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="guest-form" action={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name</label>
        <input type="text" name="firstName" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name</label>
        <input type="text" name="lastName" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input type="tel" name="phone" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nationality</label>
        <input type="text" name="nationality" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
        {loading ? "Adding..." : "Add Guest"}
      </button>
    </form>
  );
}
