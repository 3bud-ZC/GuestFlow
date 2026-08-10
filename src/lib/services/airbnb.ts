import ical from 'node-ical';

export const airbnbService = {
  validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      if (parsed.hostname !== 'www.airbnb.com') return false;
      if (!parsed.pathname.startsWith('/calendar/ical/')) return false;
      if (!parsed.pathname.endsWith('.ics')) return false;
      return true;
    } catch {
      return false;
    }
  },

  async fetchCalendar(url: string): Promise<string> {
    if (!this.validateUrl(url)) {
      throw new Error("Invalid Airbnb calendar URL");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/calendar',
          'User-Agent': 'Mozilla/5.0 (compatible; GuestFlow/0.2.0; +https://guestflow.abud.fun)'
        },
        signal: controller.signal,
        redirect: 'manual' // We handle redirects manually for security
      });

      let finalResponse = response;

      // Handle redirect
      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location')!;
        let redirectUrl;
        try {
          redirectUrl = new URL(location, url).toString();
        } catch {
          throw new Error("Invalid redirect URL");
        }

        if (!this.validateUrl(redirectUrl)) {
          throw new Error("Redirected to an invalid or unsafe URL");
        }

        finalResponse = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/calendar',
            'User-Agent': 'Mozilla/5.0 (compatible; GuestFlow/0.2.0; +https://guestflow.abud.fun)'
          },
          signal: controller.signal,
          redirect: 'error' // No further redirects allowed
        });
      }

      if (!finalResponse.ok) {
        throw new Error(`Failed to fetch calendar: HTTP ${finalResponse.status}`);
      }

      const contentLength = finalResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) { // 10MB limit
        throw new Error("Calendar response is too large");
      }

      const buffer = await finalResponse.arrayBuffer();
      if (buffer.byteLength > 10 * 1024 * 1024) {
        throw new Error("Calendar response is too large");
      }
      
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async probe(url: string) {
    try {
      const icalData = await this.fetchCalendar(url);
      const events = await ical.async.parseICS(icalData);

      // Extract listing ID from URL
      const parsedUrl = new URL(url);
      const listingIdMatch = parsedUrl.pathname.match(/\/calendar\/ical\/(\d+)\.ics/);
      const listingId = listingIdMatch ? listingIdMatch[1] : null;

      let calendarName = null;
      let eventCount = 0;
      let nextReservedPeriod = null;

      const now = new Date();
      let nextEventStart: Date | null = null;
      let nextEventEnd: Date | null = null;

      for (const k in events) {
        const ev: any = events[k];
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

      if (nextEventStart && nextEventEnd) {
        const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        nextReservedPeriod = `${nextEventStart.toLocaleDateString('en-US', formatOptions)} → ${nextEventEnd.toLocaleDateString('en-US', formatOptions)}`;
      }

      return {
        listingId,
        calendarName,
        eventCount,
        nextReservedPeriod,
        healthy: true,
      };

    } catch (e: any) {
      console.error("Airbnb probe error:", e.message);
      return {
        healthy: false,
        error: "Failed to connect or parse calendar",
      };
    }
  }
};
