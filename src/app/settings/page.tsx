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
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/types";

export default async function SettingsPage() {
  const [user, property, templates, cookieStore] = await Promise.all([
    getCurrentUser(),
    db.property.findFirst({
      include: { propertySettings: true, rooms: true }
    }),
    db.messageTemplate.findMany({ orderBy: { type: 'asc' } }),
    cookies(),
  ]);

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

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
  const locale = (cookieStore.get("gf-locale")?.value as Locale) || "en";
  const t = getDictionary(locale);
  const isRtl = locale === 'ar';

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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.navigation.settings}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your property, automation rules, and integrations.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader title={t.settings.whatsApp} />
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${waConfigured ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{t.settings.whatsApp}</h2>
                {waConfigured ? (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Configured & Active
                  </div>
                ) : (
                  <div className="flex flex-col mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                      <XCircle className="w-4 h-4" />
                      {t.settings.notConnected} / {t.settings.paused}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Airbnb" />
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Airbnb Status</h2>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.settings.active}
                </div>
                <p className="text-sm text-slate-500 mt-1">{t.settings.connectedRooms}: {property.rooms?.length || 0} / {property.rooms?.length || 0}</p>
              </div>
            </div>
            <div>
              <Button href="/settings" variant="secondary" size="sm">
                {t.settings.manageProperties}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <form action={updatePropertySettingsAction.bind(null, property.id)}>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t.settings.propertyInformation || 'Property Information'} />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" /> {t.properties.name}
                  </label>
                  <input type="text" disabled defaultValue={property.name} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> {t.properties.address}
                  </label>
                  <input type="text" name="address" defaultValue={property.address || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> {t.settings.googleMapsUrl || 'Google Maps URL'}
                  </label>
                  <input type="url" name="googleMapsUrl" defaultValue={property.googleMapsUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> {t.settings.checkinTime}
                  </label>
                  <input type="time" name="checkInTime" defaultValue={settings?.checkInTime || "15:00"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> {t.settings.checkoutTime}
                  </label>
                  <input type="time" name="checkOutTime" defaultValue={settings?.checkOutTime || "11:00"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> {t.settings.timezone}
                  </label>
                  <input type="text" name="timezone" defaultValue={settings?.timezone || "UTC"} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400" /> {t.settings.wifiName || 'Wi-Fi Name'}
                  </label>
                  <input type="text" name="wifiName" defaultValue={property.wifiName || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400" /> {t.settings.wifiPassword || 'Wi-Fi Password'}
                  </label>
                  <input type="text" name="wifiPassword" defaultValue={property.wifiPassword || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t.settings.socialMedia} />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400" /> {t.settings.instagramUrl || 'Instagram URL'}
                  </label>
                  <input type="url" name="instagramUrl" defaultValue={settings?.instagramUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400" /> {t.settings.facebookUrl || 'Facebook URL'}
                  </label>
                  <input type="url" name="facebookUrl" defaultValue={settings?.facebookUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> {t.settings.tiktokUrl || 'TikTok URL'}
                  </label>
                  <input type="url" name="tiktokUrl" defaultValue={settings?.tiktokUrl || ""} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t.settings.automationRules || 'Automation Rules'} />
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t.settings.welcomeMessage || 'Welcome Message'}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.settings.welcomeMessageDesc || 'Sent immediately when a reservation is created.'}</p>
                    </div>
                  </div>
                  <input type="checkbox" name="welcomeEnabled" defaultChecked={settings?.welcomeEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t.settings.locationDetails || 'Location Details'}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.settings.locationDetailsDesc || 'Sent before check-in.'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">{t.settings.send || 'Send'}</span>
                        <input type="number" name="locationOffsetHours" defaultValue={settings?.locationOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">{t.settings.hoursBeforeCheckin || 'hours before check-in'}</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="locationEnabled" defaultChecked={settings?.locationEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t.settings.idReminder || 'ID Reminder'}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.settings.idReminderDesc || 'Sent before check-in if ID is still PENDING.'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">{t.settings.send || 'Send'}</span>
                        <input type="number" name="idReminderOffsetHours" defaultValue={settings?.idReminderOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">{t.settings.hoursBeforeCheckin || 'hours before check-in'}</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="idReminderEnabled" defaultChecked={settings?.idReminderEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t.settings.checkoutReminder || 'Check-out Reminder'}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.settings.checkoutReminderDesc || 'Sent before check-out.'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-slate-600">{t.settings.send || 'Send'}</span>
                        <input type="number" name="checkoutOffsetHours" defaultValue={settings?.checkoutOffsetHours ?? 24} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                        <span className="text-sm text-slate-600">{t.settings.hoursBeforeCheckout || 'hours before check-out'}</span>
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" name="checkoutReminderEnabled" defaultChecked={settings?.checkoutReminderEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t.settings.reviewRequest || 'Review Request'}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.settings.reviewRequestDesc || 'Sent after check-out.'}</p>
                    </div>
                  </div>
                  <input type="checkbox" name="reviewRequestEnabled" defaultChecked={settings?.reviewRequestEnabled ?? true} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </div>
              </div>
            </CardContent>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end">
              <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                {t.common.save}
              </Button>
            </div>
          </Card>
        </div>
      </form>

      <Card>
        <CardHeader title={t.messages.templates || 'Message Templates'} />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.messages.type}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta Template Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.messages.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{t.messages[template.type as keyof typeof t.messages] || template.type}</td>
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
