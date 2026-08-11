import ical from 'node-ical';

// Safe error categories for diagnostics
export type AirbnbErrorCode =
  | 'AIRBNB_URL_INVALID'
  | 'AIRBNB_FETCH_TIMEOUT'
  | 'AIRBNB_HTTP_ERROR'
  | 'AIRBNB_REDIRECT_REJECTED'
  | 'AIRBNB_INVALID_ICS'
  | 'AIRBNB_PARSE_FAILED'
  | 'AIRBNB_DUPLICATE_LISTING'
  | 'AIRBNB_DATABASE_FAILED'
  | 'AIRBNB_SYNC_FAILED';

export class AirbnbError extends Error {
  code: AirbnbErrorCode;
  userMessage: { en: string; ar: string };

  constructor(
    code: AirbnbErrorCode,
    message: string,
    userMessage: { en: string; ar: string }
  ) {
    super(message);
    this.name = 'AirbnbError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

// Validate that a URL is a legitimate Airbnb export calendar URL.
// Airbnb's "Export Calendar" feature only ever issues iCal links on the
// primary www.airbnb.com host (or an Airbnb-controlled *.airbnb.com
// subdomain) — there is no separate export host for regional ccTLDs
// (airbnb.co.uk, airbnb.fr, ...), so this allowlist is not broadened
// beyond www.airbnb.com. Strict hostname + path matching also doubles
// as SSRF protection: localhost, private IPs, and arbitrary domains can
// never match, and non-HTTPS URLs are rejected outright.
function validateAirbnbUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname !== 'www.airbnb.com' && !parsed.hostname.endsWith('.airbnb.com')) return false;
    if (!parsed.pathname.startsWith('/calendar/ical/')) return false;
    if (!parsed.pathname.endsWith('.ics')) return false;
    return true;
  } catch {
    return false;
  }
}

// Safely extract listing ID from URL path without logging the token
function extractListingId(pathname: string): string | null {
  const match = pathname.match(/\/calendar\/ical\/(\d+)\.ics/);
  return match ? match[1] : null;
}

export const airbnbService = {
  validateUrl: validateAirbnbUrl,

  async fetchCalendar(url: string): Promise<string> {
    if (!this.validateUrl(url)) {
      throw new AirbnbError(
        'AIRBNB_URL_INVALID',
        'Invalid Airbnb calendar URL format',
        {
          en: 'The Airbnb calendar link format is not valid. Please copy the link directly from Airbnb › Calendar › Export Calendar.',
          ar: 'تنسيق رابط تقويم Airbnb غير صحيح. يرجى نسخ الرابط مباشرةً من Airbnb › التقويم › تصدير التقويم.',
        }
      );
    }

    const parsedUrl = new URL(url);
    const listingId = extractListingId(parsedUrl.pathname);
    // Safe log: only listing ID and hostname, never query params (contains token)
    console.log(`[Airbnb] Fetch started. Listing: ${listingId ?? 'unknown'}, Host: ${parsedUrl.hostname}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/calendar, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; GuestFlow/0.4.0; +https://guestflow.abud.fun)',
        },
        signal: controller.signal,
        redirect: 'manual',
      });

      let finalResponse = response;

      // Handle single redirect
      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location')!;
        let redirectUrl: string;
        try {
          redirectUrl = new URL(location, url).toString();
        } catch {
          throw new AirbnbError(
            'AIRBNB_REDIRECT_REJECTED',
            'Invalid redirect URL received',
            {
              en: 'Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.',
              ar: 'تعذر الوصول إلى تقويم Airbnb. تأكد من رابط تصدير التقويم وحاول مرة أخرى.',
            }
          );
        }

        if (!this.validateUrl(redirectUrl)) {
          throw new AirbnbError(
            'AIRBNB_REDIRECT_REJECTED',
            `Redirect to unsafe or non-Airbnb host rejected`,
            {
              en: 'Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.',
              ar: 'تعذر الوصول إلى تقويم Airbnb. تأكد من رابط تصدير التقويم وحاول مرة أخرى.',
            }
          );
        }

        finalResponse = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/calendar, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; GuestFlow/0.4.0; +https://guestflow.abud.fun)',
          },
          signal: controller.signal,
          redirect: 'error',
        });
      }

      // Safe log: status and byte count only
      const contentLength = finalResponse.headers.get('content-length');
      console.log(`[Airbnb] HTTP ${finalResponse.status}. Content-Length: ${contentLength ?? 'unknown'}`);

      if (!finalResponse.ok) {
        throw new AirbnbError(
          'AIRBNB_HTTP_ERROR',
          `HTTP error ${finalResponse.status}`,
          {
            en: finalResponse.status === 404
              ? 'The Airbnb calendar was not found. Please check that the Export Calendar link is correct and the listing is active.'
              : `Could not reach the Airbnb calendar (HTTP ${finalResponse.status}). Please verify the Export Calendar link and try again.`,
            ar: finalResponse.status === 404
              ? 'لم يتم العثور على تقويم Airbnb. تأكد من صحة رابط تصدير التقويم وأن الوحدة نشطة.'
              : `تعذر الوصول إلى تقويم Airbnb (HTTP ${finalResponse.status}). تأكد من رابط تصدير التقويم وحاول مرة أخرى.`,
          }
        );
      }

      const buffer = await finalResponse.arrayBuffer();
      const byteCount = buffer.byteLength;

      if (byteCount > 10 * 1024 * 1024) {
        throw new AirbnbError(
          'AIRBNB_INVALID_ICS',
          'Calendar response too large (>10MB)',
          {
            en: 'The calendar data is too large. Please contact support.',
            ar: 'بيانات التقويم كبيرة جداً. يرجى الاتصال بالدعم.',
          }
        );
      }

      console.log(`[Airbnb] Response received. Bytes: ${byteCount}`);

      if (byteCount === 0) {
        throw new AirbnbError(
          'AIRBNB_INVALID_ICS',
          'Empty calendar response',
          {
            en: 'The Airbnb calendar returned no data. Please verify the Export Calendar link is still valid.',
            ar: 'لم يُرجع تقويم Airbnb أي بيانات. تأكد من أن رابط تصدير التقويم لا يزال صالحاً.',
          }
        );
      }

      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);

      // Basic ICS sanity check
      if (!text.includes('BEGIN:VCALENDAR')) {
        throw new AirbnbError(
          'AIRBNB_INVALID_ICS',
          'Response is not a valid ICS calendar',
          {
            en: 'The link does not point to a valid Airbnb calendar. Please copy the Export Calendar link directly from Airbnb.',
            ar: 'الرابط لا يشير إلى تقويم Airbnb صحيح. يرجى نسخ رابط تصدير التقويم مباشرةً من Airbnb.',
          }
        );
      }

      return text;
    } catch (err: any) {
      if (err instanceof AirbnbError) throw err;

      if (err.name === 'AbortError') {
        throw new AirbnbError(
          'AIRBNB_FETCH_TIMEOUT',
          'Airbnb calendar fetch timed out',
          {
            en: 'The request to Airbnb timed out. Please check your connection and try again.',
            ar: 'انتهت مهلة الطلب إلى Airbnb. تحقق من اتصالك وحاول مرة أخرى.',
          }
        );
      }

      throw new AirbnbError(
        'AIRBNB_FETCH_TIMEOUT',
        `Network error: ${err.message}`,
        {
          en: 'Could not reach the Airbnb calendar. Please check your connection and try again.',
          ar: 'تعذر الوصول إلى تقويم Airbnb. تحقق من اتصالك وحاول مرة أخرى.',
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async probe(url: string) {
    try {
      const icalData = await this.fetchCalendar(url);

      let events: Record<string, any>;
      try {
        events = await ical.async.parseICS(icalData);
      } catch (parseErr: any) {
        console.error('[Airbnb] ICS parse error:', parseErr.message);
        return {
          healthy: false,
          errorCode: 'AIRBNB_PARSE_FAILED' as AirbnbErrorCode,
          error: 'Failed to parse calendar data. The export link may be corrupted.',
          errorAr: 'فشل تحليل بيانات التقويم. قد يكون رابط التصدير تالفاً.',
        };
      }

      const parsedUrl = new URL(url);
      const listingId = extractListingId(parsedUrl.pathname);

      let calendarName: string | null = null;
      let eventCount = 0;
      let nextEventStart: Date | null = null;
      let nextEventEnd: Date | null = null;
      const now = new Date();

      for (const k in events) {
        const ev: any = events[k];
        // node-ical parses X-WR-CALNAME as 'WR-CALNAME'
        if (ev.type === 'VCALENDAR' && ev['WR-CALNAME']) {
          calendarName = ev['WR-CALNAME'];
        } else if (ev.type === 'VEVENT') {
          eventCount++;
          if (ev.start && ev.end && ev.start > now) {
            if (!nextEventStart || ev.start < nextEventStart) {
              nextEventStart = ev.start;
              nextEventEnd = ev.end;
            }
          }
        }
      }

      let nextReservedPeriod: string | null = null;
      if (nextEventStart && nextEventEnd) {
        const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        nextReservedPeriod = `${nextEventStart.toLocaleDateString('en-US', fmt)} → ${nextEventEnd.toLocaleDateString('en-US', fmt)}`;
      }

      console.log(`[Airbnb] Probe complete. Listing: ${listingId ?? 'unknown'}, Events: ${eventCount}`);

      return {
        listingId,
        calendarName,
        eventCount,
        nextReservedPeriod,
        healthy: true,
      };
    } catch (e: any) {
      const errorCode: AirbnbErrorCode = e instanceof AirbnbError ? e.code : 'AIRBNB_FETCH_TIMEOUT';
      const userEn = e instanceof AirbnbError
        ? e.userMessage.en
        : 'Could not reach the Airbnb calendar. Please verify the Export Calendar link and try again.';
      const userAr = e instanceof AirbnbError
        ? e.userMessage.ar
        : 'تعذر الوصول إلى تقويم Airbnb. تأكد من رابط تصدير التقويم وحاول مرة أخرى.';

      // Safe log: error code only, never URL/token
      console.error(`[Airbnb] Probe failed. Code: ${errorCode}. Message: ${e.message}`);

      return {
        healthy: false,
        errorCode,
        error: userEn,
        errorAr: userAr,
      };
    }
  },
};
