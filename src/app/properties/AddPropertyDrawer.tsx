"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { PropertyForm } from "./PropertyForm";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function AddPropertyDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      title="Add Property"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<Plus className="w-4 h-4" />}>
          Add Property
        </Button>
      }
    >
      <PropertyForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
