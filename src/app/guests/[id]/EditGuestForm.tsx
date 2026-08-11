"use client";

import { useState } from "react";
import { updateGuestAction } from "../actions";

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
};

export function EditGuestForm({ guest }: { guest: Guest }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await updateGuestAction(guest.id, formData);
      setEditing(false);
    } catch (e: any) {
      setError(e.message || "Failed to update guest");
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
    <form action={handleSubmit} className="space-y-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">First Name</label>
          <input type="text" name="firstName" defaultValue={guest.firstName} required className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Last Name</label>
          <input type="text" name="lastName" defaultValue={guest.lastName} required className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Email</label>
        <input type="email" name="email" defaultValue={guest.email || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Phone</label>
        <input type="tel" name="phone" defaultValue={guest.phone || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Nationality</label>
        <input type="text" name="nationality" defaultValue={guest.nationality || ""} className="mt-1 block w-full rounded border-slate-300 shadow-sm p-2 border text-sm focus:border-blue-500 focus:ring-blue-500" />
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
