"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/Button";
import { CheckSquare } from "lucide-react";

export function AddTaskDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      title="Create Task"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<CheckSquare className="w-4 h-4" />}>
          Create Task
        </Button>
      }
    >
      <TaskForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
