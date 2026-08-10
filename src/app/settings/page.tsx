import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { updatePropertySettingsAction } from "./actions";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Globe, 
  Wifi, 
  Save, 
  MessageCircle,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Bell,
  Link as LinkIcon
} from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const property = await db.property.findFirst({
    include: { propertySettings: true }
  });

  if (!property) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">No property found</h3>
        <p className="text-sm text-slate-500 mt-1">Create a property first to manage settings.</p>
      </div>
    );
  }

  const settings = property.propertySettings;

  // Check WhatsApp Integration Status
  const waConfigured = !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID &&
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your property, automation rules, and integrations.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${waConfigured ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">WhatsApp Integration</h2>
              {waConfigured ? (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Configured & Active
                </div>
              ) : (
                <div className="flex flex-col mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                    <XCircle className="w-4 h-4" />
                    Not Configured
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Missing required environment variables.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form action={updatePropertySettingsAction.bind(null, property.id)}>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Property Information" />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" /> Property Name
                  </label>
                  <input type="text" disabled defaultValue={property.name} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Address
                  </label>
                  <input type="text" name="address" defaultValue={property.address || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> Google Maps URL
                  </label>
                  <input type="url" name="googleMapsUrl" defaultValue={property.googleMapsUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Check-in Time
                  </label>
                  <input type="time" name="checkInTime" defaultValue={settings?.checkInTime || "15:00"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Check-out Time
                  </label>
                  <input type="time" name="checkOutTime" defaultValue={settings?.checkOutTime || "11:00"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> Timezone
                  </label>
                  <input type="text" name="timezone" defaultValue={settings?.timezone || "UTC"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400" /> Wi-Fi Name
                  </label>
                  <input type="text" name="wifiName" defaultValue={property.wifiName || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400" /> Wi-Fi Password
                  </label>
                  <input type="text" name="wifiPassword" defaultValue={property.wifiPassword || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Social Media" />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400" /> Instagram URL
                  </label>
                  <input type="url" name="instagramUrl" defaultValue={settings?.instagramUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400" /> Facebook URL
                  </label>
                  <input type="url" name="facebookUrl" defaultValue={settings?.facebookUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> TikTok URL
                  </label>
                  <input type="url" name="tiktokUrl" defaultValue={settings?.tiktokUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Automation Rules" />
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Welcome Message</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sent immediately when a reservation is created.</p>
                    </div>
                  </div>
                  <input type="checkbox" name="welcomeEnabled" defaultChecked={settings?.welcomeEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Location Details</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sent before check-in.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">Send</span>
                        <input type="number" name="locationOffsetHours" defaultValue={settings?.locationOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">hours before check-in</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="locationEnabled" defaultChecked={settings?.locationEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">ID Reminder</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sent before check-in if ID is still PENDING.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">Send</span>
                        <input type="number" name="idReminderOffsetHours" defaultValue={settings?.idReminderOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">hours before check-in</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="idReminderEnabled" defaultChecked={settings?.idReminderEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Check-out Reminder</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sent before check-out.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">Send</span>
                        <input type="number" name="checkoutOffsetHours" defaultValue={settings?.checkoutOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">hours before check-out</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="checkoutReminderEnabled" defaultChecked={settings?.checkoutReminderEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Review Request</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sent after check-out.</p>
                    </div>
                  </div>
                  <input type="checkbox" name="reviewRequestEnabled" defaultChecked={settings?.reviewRequestEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>
              </div>
            </CardContent>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end">
              <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
            </div>
          </Card>
        </div>
      </form>

      <Card>
        <CardHeader title="Message Templates" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta Template Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(await db.messageTemplate.findMany()).map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{template.type.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{template.metaTemplateName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{template.languageCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={template.enabled ? 'success' : 'neutral'}>
                      {template.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
