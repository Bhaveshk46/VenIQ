/**
 * directions.test.js
 * Unit tests for the core stadium data and heuristic routing logic.
 * Run with: npm test
 */
import { describe, it, expect } from 'vitest';
import { VENUE_LOCATIONS, STADIUM_SECTIONS, getWalkingInstructions } from './directions';
import { NORTH_SHOPS, SOUTH_SHOPS, SEATING_GROUPS, MAX_CHAT_INPUT_LENGTH } from './constants';

// --- VENUE_LOCATIONS Integrity Tests ---
describe('VENUE_LOCATIONS data integrity', () => {
  it('should have at least one gate', () => {
    const gates = Object.values(VENUE_LOCATIONS).filter(loc => loc.type === 'gate');
    expect(gates.length).toBeGreaterThan(0);
  });

  it('should have at least one food location', () => {
    const food = Object.values(VENUE_LOCATIONS).filter(loc => loc.type === 'food');
    expect(food.length).toBeGreaterThan(0);
  });

  it('should have 8 seating blocks (A through H)', () => {
    const blocks = Object.keys(VENUE_LOCATIONS).filter(id => id.startsWith('block_'));
    expect(blocks.length).toBe(8);
  });

  it('every location must have top, left, name, and type', () => {
    Object.entries(VENUE_LOCATIONS).forEach(([id, loc]) => {
      expect(loc, `Location "${id}" is missing required fields`).toMatchObject({
        top: expect.any(Number),
        left: expect.any(Number),
        name: expect.any(String),
        type: expect.any(String),
      });
    });
  });

  it('all top/left coordinates should be within valid 0-100 percentage range', () => {
    Object.entries(VENUE_LOCATIONS).forEach(([id, loc]) => {
      expect(loc.top, `"${id}" top is out of range`).toBeGreaterThanOrEqual(0);
      expect(loc.top, `"${id}" top is out of range`).toBeLessThanOrEqual(100);
      expect(loc.left, `"${id}" left is out of range`).toBeGreaterThanOrEqual(0);
      expect(loc.left, `"${id}" left is out of range`).toBeLessThanOrEqual(100);
    });
  });
});

// --- STADIUM_SECTIONS Tests ---
describe('STADIUM_SECTIONS', () => {
  it('should have exactly 4 sections', () => {
    expect(STADIUM_SECTIONS.length).toBe(4);
  });

  it('each section should be a non-empty string', () => {
    STADIUM_SECTIONS.forEach(section => {
      expect(typeof section).toBe('string');
      expect(section.length).toBeGreaterThan(0);
    });
  });
});

// --- getWalkingInstructions Tests ---
describe('getWalkingInstructions()', () => {
  it('returns an error message when fromSection is missing', async () => {
    const result = await getWalkingInstructions(null, 'gate_north');
    expect(result).toContain('Please select');
  });

  it('returns an error message when toZoneId is invalid', async () => {
    const result = await getWalkingInstructions('Garware Pavilion', 'nonexistent_zone');
    expect(result).toContain('Please select');
  });

  it('returns a valid string with location name for valid inputs', async () => {
    const result = await getWalkingInstructions('Garware Pavilion', 'gate_north');
    expect(typeof result).toBe('string');
    expect(result).toContain('Gate 1');
  });
});

// --- Shop Data Integrity Tests ---
describe('NORTH_SHOPS data integrity', () => {
  it('should have at least 5 vendors', () => {
    expect(NORTH_SHOPS.length).toBeGreaterThanOrEqual(5);
  });

  it('every shop must have an id, name, desc, and menu array', () => {
    NORTH_SHOPS.forEach(shop => {
      expect(shop).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        desc: expect.any(String),
        menu: expect.any(Array),
      });
    });
  });

  it('every menu item must have a title and price', () => {
    NORTH_SHOPS.forEach(shop => {
      shop.menu.forEach(item => {
        expect(item).toMatchObject({
          title: expect.any(String),
          price: expect.any(String),
        });
      });
    });
  });
});

describe('SOUTH_SHOPS data integrity', () => {
  it('should have at least 5 vendors', () => {
    expect(SOUTH_SHOPS.length).toBeGreaterThanOrEqual(5);
  });
});

// --- Seating Groups Tests ---
describe('SEATING_GROUPS data integrity', () => {
  it('should have 3 tiers: lower, club, and vip', () => {
    const ids = SEATING_GROUPS.map(g => g.id);
    expect(ids).toContain('lower');
    expect(ids).toContain('club');
    expect(ids).toContain('vip');
  });

  it('tiers should not have overlapping row numbers', () => {
    const [lower, club, vip] = SEATING_GROUPS;
    expect(club.startNumber).toBe(lower.startNumber + lower.count);
    expect(vip.startNumber).toBe(club.startNumber + club.count);
  });
});

// --- Security: Input Sanitization Test ---
describe('MAX_CHAT_INPUT_LENGTH security constant', () => {
  it('should be a positive number and not excessively large', () => {
    expect(MAX_CHAT_INPUT_LENGTH).toBeGreaterThan(50);
    expect(MAX_CHAT_INPUT_LENGTH).toBeLessThanOrEqual(1000);
  });
});
