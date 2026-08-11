"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { PropertyForm } from "./PropertyForm";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export function AddPropertyDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  return (
    <Drawer
      title={t.topbar.addProperty}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<Plus className="w-4 h-4" />}>
          {t.topbar.addProperty}
        </Button>
      }
    >
      <PropertyForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
