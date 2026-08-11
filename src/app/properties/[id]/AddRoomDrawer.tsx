"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { RoomForm } from "./RoomForm";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export function AddRoomDrawer({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  return (
    <Drawer
      title={t.airbnb.addRoom}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<Plus className="w-4 h-4" />}>
          {t.airbnb.addRoom}
        </Button>
      }
    >
      <RoomForm propertyId={propertyId} onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
