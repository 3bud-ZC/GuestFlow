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
        statusText: 'Not Found'
      });

      const result = await airbnbService.probe('https://www.airbnb.com/calendar/ical/invalid.ics');

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Failed to connect or parse calendar');
    });
  });
});
