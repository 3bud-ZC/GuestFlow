"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/Button";
import { CheckSquare } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export function AddTaskDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  return (
    <Drawer
      title={t.tasks.addTask}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<CheckSquare className="w-4 h-4" />}>
          {t.tasks.addTask}
        </Button>
      }
    >
      <TaskForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
