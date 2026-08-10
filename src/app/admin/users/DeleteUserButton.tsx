"use client";

import { useState } from "react";
import { deleteUser } from "./actions";

export function DeleteUserButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    setLoading(true);
    try {
      await deleteUser(userId);
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
