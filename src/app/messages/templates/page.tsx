import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { messageTemplateService } from "@/lib/services/messageTemplate";
import { TemplateList } from "./TemplateList";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

export default async function MessageTemplatesPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/messages");
  }

  // Ensure default mappings exist in the database
  await messageTemplateService.seedDefaultTemplates();
  const templates = await messageTemplateService.getTemplates();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Button href="/messages" variant="ghost" size="sm" className="-ml-3 h-8" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Messages
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Message Templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure the approved WhatsApp templates used by GuestFlow operational messaging.
          </p>
        </div>
      </div>

      <TemplateList initialTemplates={templates} />
    </div>
  );
}
