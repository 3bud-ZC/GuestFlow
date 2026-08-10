import { describe, it, expect, vi } from 'vitest';
import { airbnbService } from '../airbnb';
import ical from 'node-ical';

vi.mock('node-ical', () => ({
  default: {
    async: {
      parseICS: vi.fn(),
    }
  }
}));

describe('Airbnb Service', () => {
  describe('validateUrl', () => {
    it('should return true for valid Airbnb calendar URLs', () => {
      expect(airbnbService.validateUrl('https://www.airbnb.com/calendar/ical/123.ics')).toBe(true);
      expect(airbnbService.validateUrl('https://www.airbnb.com/calendar/ical/123.ics?s=xyz')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(airbnbService.validateUrl('http://www.airbnb.com/calendar/ical/123.ics')).toBe(false);
      expect(airbnbService.validateUrl('https://airbnb.com/calendar/ical/123.ics')).toBe(false);
      expect(airbnbService.validateUrl('https://www.airbnb.com/rooms/123')).toBe(false);
      expect(airbnbService.validateUrl('https://google.com')).toBe(false);
      expect(airbnbService.validateUrl('not-a-url')).toBe(false);
    });
  });

  describe('probe', () => {
    it('should extract listing ID and calendar name from a valid ICS', async () => {
      const mockIcs = {
        'vcalendar': { type: 'VCALENDAR', 'WR-CALNAME': 'Cozy Apartment' },
        'event1': { type: 'VEVENT', start: new Date(Date.now() + 86400000), end: new Date(Date.now() + 172800000) }
      };
      
      (ical.async.parseICS as any).mockResolvedValue(mockIcs);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('BEGIN:VCALENDAR...'),
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode('BEGIN:VCALENDAR...').buffer),
        headers: {
          get: (key: string) => {
            if (key === 'content-length') return '1024';
            return null;
          },
          has: (key: string) => false,
        }
      });

      const result = await airbnbService.probe('https://www.airbnb.com/calendar/ical/987654.ics');

      expect(result.healthy).toBe(true);
      expect(result.listingId).toBe('987654');
      expect(result.calendarName).toBe('Cozy Apartment');
      expect(result.eventCount).toBe(1);
      expect(result.nextReservedPeriod).toBeDefined();
    });

    it('should handle failed fetches gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (key: string) => null,
          has: (key: string) => false,
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

      const result = await airbnbService.probe('https://www.airbnb.com/calendar/ical/99999999.ics');

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('not found');
      expect((result as any).errorCode).toBe('AIRBNB_HTTP_ERROR');
    });
  });
});
