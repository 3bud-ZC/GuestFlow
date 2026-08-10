"use client";

import { useState } from "react";
import { updateTaskStatusAction } from "../actions";
import { TaskStatus } from "@prisma/client";

export function TaskStatusForm({ taskId, currentStatus }: { taskId: string, currentStatus: TaskStatus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    setError("");
    try {
      await updateTaskStatusAction(taskId, e.target.value as TaskStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        className={`block w-full max-w-xs rounded-md shadow-sm sm:text-sm border p-2 font-medium ${
          currentStatus === 'DONE' ? 'bg-green-50 text-green-800 border-green-200' :
          currentStatus === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
          currentStatus === 'CANCELLED' ? 'bg-gray-50 text-gray-800 border-gray-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}
      >
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      {loading && <div className="text-xs text-gray-500 mt-1">Updating...</div>}
    </div>
  );
}
