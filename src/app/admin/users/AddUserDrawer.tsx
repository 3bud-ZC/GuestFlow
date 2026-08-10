"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { CreateUserForm } from "./CreateUserForm";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

export function AddUserDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      title="Create User"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button icon={<UserPlus className="w-4 h-4" />}>
          Create User
        </Button>
      }
    >
      <CreateUserForm onSuccess={() => setOpen(false)} />
    </Drawer>
  );
}
