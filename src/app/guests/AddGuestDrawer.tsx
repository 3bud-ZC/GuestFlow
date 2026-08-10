"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { GuestForm } from "./GuestForm";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

export function AddGuestDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      title="Add Guest"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<UserPlus className="w-4 h-4" />}>
          Add Guest
        </Button>
      }
    >
      <GuestForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
