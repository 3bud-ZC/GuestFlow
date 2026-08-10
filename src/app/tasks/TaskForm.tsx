"use client";

import { useState } from "react";
import { createTaskAction } from "./actions";
import { TaskPriority } from "@prisma/client";

export function TaskForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createTaskAction(formData);
      (document.getElementById("task-form") as HTMLFormElement)?.reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="task-form" action={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" name="title" required className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={2}></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <select name="priority" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
          {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reservation ID (Optional)</label>
        <input type="text" name="reservationId" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Guest ID (Optional)</label>
        <input type="text" name="guestId" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
      </div>

      <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
        {loading ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
}
