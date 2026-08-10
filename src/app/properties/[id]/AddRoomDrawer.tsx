"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { RoomForm } from "./RoomForm";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function AddRoomDrawer({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      title="Add Room"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<Plus className="w-4 h-4" />}>
          Add Room
        </Button>
      }
    >
      <RoomForm propertyId={propertyId} onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
