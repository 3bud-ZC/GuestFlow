"use client";

import { useState } from "react";
import { MessageTemplate } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Drawer } from "@/components/ui/Drawer";
import { Settings, MessageSquare, Pencil, Check, X, AlertCircle } from "lucide-react";
import { updateTemplateAction } from "./actions";
import { useRouter } from "next/navigation";

export function TemplateList({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setError(null);
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      metaTemplateName: formData.get("metaTemplateName") as string,
      languageCode: formData.get("languageCode") as string,
      enabled: formData.get("enabled") === "on",
      description: formData.get("description") as string,
    };

    const result = await updateTemplateAction(editingTemplate.id, data);
    
    setIsLoading(false);
    if (result.success) {
      setIsDrawerOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Failed to update template");
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        {initialTemplates.length === 0 ? (
          <EmptyState 
            icon={MessageSquare}
            title="No message templates configured."
            description="Configure the approved Meta WhatsApp templates GuestFlow should use for automated and manual communication."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Type</TableHead>
              <TableHead>Meta Template Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableHeader>
            <TableBody>
              {initialTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium text-slate-900">
                    {template.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs">
                    {template.metaTemplateName}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {template.languageCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.enabled ? "success" : "neutral"}>
                      {template.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(template.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleEdit(template)} variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Drawer
        title="Edit Template Configuration"
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        {editingTemplate && (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                GuestFlow Message Type
              </label>
              <input
                type="text"
                disabled
                value={editingTemplate.type.replace(/_/g, ' ')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">This internal type cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="metaTemplateName" className="block text-sm font-medium text-slate-700 mb-1">
                Meta Template Name
              </label>
              <input
                type="text"
                id="metaTemplateName"
                name="metaTemplateName"
                defaultValue={editingTemplate.metaTemplateName}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. guestflow_welcome"
              />
              <p className="text-xs text-slate-500 mt-1">The exact template name as approved in your Meta WhatsApp Manager.</p>
            </div>

            <div>
              <label htmlFor="languageCode" className="block text-sm font-medium text-slate-700 mb-1">
                Language Code
              </label>
              <input
                type="text"
                id="languageCode"
                name="languageCode"
                defaultValue={editingTemplate.languageCode}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. en, en_US, es"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={editingTemplate.description || ""}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Internal notes about this template..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label htmlFor="enabled" className="text-sm font-medium text-slate-900 block">
                  Enable Template
                </label>
                <p className="text-xs text-slate-500 mt-0.5">Allow GuestFlow to use this template for outbound messages.</p>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="enabled"
                  name="enabled"
                  type="checkbox"
                  defaultChecked={editingTemplate.enabled}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </>
  );
}
