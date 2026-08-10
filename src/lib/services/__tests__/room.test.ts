import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roomService } from '../room';
import { db } from '@/lib/db';
import { airbnbService } from '../airbnb';
import { syncService } from '../sync';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    room: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }
  }
}));

vi.mock('../airbnb', () => ({
  airbnbService: {
    validateUrl: vi.fn(),
    probe: vi.fn(),
  }
}));

vi.mock('../sync', () => ({
  syncService: {
    syncRoom: vi.fn(),
  }
}));

describe('roomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('connectAirbnbConnection', () => {
    const roomId = 'room-123';
    const validUrl = 'https://www.airbnb.com/calendar/ical/99999999.ics';
    const invalidUrl = 'https://evil.com/cal.ics';
    
    it('should reject invalid URLs', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(false);
      
      await expect(roomService.connectAirbnbConnection(roomId, invalidUrl))
        .rejects.toThrow('Invalid Airbnb calendar URL.');
      
      expect(airbnbService.probe).not.toHaveBeenCalled();
    });

    it('should reject if probe fails', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(true);
      vi.mocked(airbnbService.probe).mockResolvedValue({ healthy: false, errorCode: 'AIRBNB_FETCH_TIMEOUT', error: 'Network error', errorAr: 'خطأ في الشبكة' });
      
      await expect(roomService.connectAirbnbConnection(roomId, validUrl))
        .rejects.toThrow('Network error');
    });

    it('should reject if exactly the same URL is connected to another room', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(true);
      vi.mocked(airbnbService.probe).mockResolvedValue({ 
        healthy: true, 
        listingId: '99999999', 
        calendarName: 'My Listing',
        eventCount: 5,
        nextReservedPeriod: null
      });
      
      vi.mocked(db.room.findFirst).mockResolvedValueOnce({ id: 'different-room' } as any); // For URL check

      await expect(roomService.connectAirbnbConnection(roomId, validUrl))
        .rejects.toThrow('This Airbnb URL is already connected to another room.');
    });

    it('should reject if the same Listing ID is actively connected to another room', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(true);
      vi.mocked(airbnbService.probe).mockResolvedValue({ 
        healthy: true, 
        listingId: '99999999', 
        calendarName: 'My Listing',
        eventCount: 5,
        nextReservedPeriod: null
      });
      
      vi.mocked(db.room.findFirst)
        .mockResolvedValueOnce(null) // URL check passes
        .mockResolvedValueOnce({ id: 'different-room' } as any); // Listing ID check fails

      await expect(roomService.connectAirbnbConnection(roomId, validUrl))
        .rejects.toThrow('This Airbnb listing ID is already actively connected to another room.');
    });

    it('should allow reconnection for the same room and successfully run initial sync', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(true);
      vi.mocked(airbnbService.probe).mockResolvedValue({ 
        healthy: true, 
        listingId: '99999999', 
        calendarName: 'My Listing',
        eventCount: 5,
        nextReservedPeriod: null
      });
      
      vi.mocked(db.room.findFirst)
        .mockResolvedValueOnce(null) // URL check passes
        .mockResolvedValueOnce({ id: roomId } as any); // Listing ID check passes (same room)

      vi.mocked(db.room.update).mockResolvedValue({ id: roomId } as any);
      vi.mocked(syncService.syncRoom).mockResolvedValue({ success: true, summary: {} as any });

      const result = await roomService.connectAirbnbConnection(roomId, validUrl);
      
      expect(result).toEqual({ success: true, summary: {} });
      
      // Verify db update used server-derived metadata
      expect(db.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: {
          airbnbIcalUrl: validUrl,
          airbnbListingId: '99999999',
          airbnbCalendarName: 'My Listing',
          airbnbSyncEnabled: true,
          airbnbLastSyncError: null,
        }
      });
      
      expect(syncService.syncRoom).toHaveBeenCalledWith(roomId);
    });

    it('should persist sync errors to health field but not fail connection', async () => {
      vi.mocked(airbnbService.validateUrl).mockReturnValue(true);
      vi.mocked(airbnbService.probe).mockResolvedValue({ 
        healthy: true, 
        listingId: '99999999', 
        calendarName: 'My Listing',
        eventCount: 5,
        nextReservedPeriod: null
      });
      
      vi.mocked(db.room.findFirst).mockResolvedValue(null);
      vi.mocked(syncService.syncRoom).mockRejectedValue(new Error('Sync failure'));

      const result = await roomService.connectAirbnbConnection(roomId, validUrl);
      
      expect(result).toEqual({ success: false, error: 'Sync failure' });
      
      // Should have updated DB with the error
      expect(db.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: { airbnbLastSyncError: 'Sync failure' }
      });
    });
  });
});
