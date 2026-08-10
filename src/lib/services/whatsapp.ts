export interface WhatsAppTemplatePayload {
  name: string;
  language: {
    code: string;
  };
  components?: any[];
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export const whatsappService = {
  getConfig() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION || "v20.0";
    
    if (!token || !phoneId) {
      return null;
    }
    
    return { token, phoneId, version };
  },

  normalizePhone(phone: string): string | null {
    // Basic normalization: remove non-digits
    const clean = phone.replace(/\D/g, '');
    // WhatsApp requires international format. Assume minimum 8 digits for a valid number with code.
    if (clean.length < 8) return null;
    return clean;
  },

  async sendTemplateMessage(to: string, template: WhatsAppTemplatePayload): Promise<WhatsAppSendResult> {
    const config = this.getConfig();
    if (!config) {
      return { success: false, error: "WhatsApp credentials required for live send verification." };
    }

    const { token, phoneId, version } = config;
    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: template,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (data.messages && data.messages.length > 0) {
        return {
          success: true,
          providerMessageId: data.messages[0].id
        };
      }

      return { success: false, error: "Invalid success response format from Meta" };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: "Request timed out" };
      }
      return { success: false, error: error.message || "Unknown network error" };
    }
  }
};
