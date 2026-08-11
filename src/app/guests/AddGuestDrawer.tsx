"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { GuestForm } from "./GuestForm";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export function AddGuestDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  return (
    <Drawer
      title={t.topbar.addGuest}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<UserPlus className="w-4 h-4" />}>
          {t.topbar.addGuest}
        </Button>
      }
    >
      <GuestForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
