/**
 * Test suite for theme tokens
 * Validates glassmorphism tokens according to spec requirements
 */

import { glass, NATIONAL_COLORS, getNationalColor, getFlagEmoji, getGreeting } from './theme';

describe('Glassmorphism Tokens', () => {
  describe('glass object', () => {
    it('should have light property with correct rgba value', () => {
      expect(glass.light).toBe('rgba(255, 255, 255, 0.72)');
    });

    it('should have dark property with correct rgba value', () => {
      expect(glass.dark).toBe('rgba(30, 30, 30, 0.72)');
    });

    it('should have border property with correct rgba value', () => {
      expect(glass.border).toBe('rgba(255, 255, 255, 0.18)');
    });

    it('should have blur property with value 20', () => {
      expect(glass.blur).toBe(20);
    });

    it('should not have any additional properties', () => {
      const expectedKeys = ['light', 'dark', 'border', 'blur'];
      const actualKeys = Object.keys(glass);
      expect(actualKeys).toEqual(expectedKeys);
    });
  });

  describe('getNationalColor', () => {
    it('should return correct color for known team code', () => {
      const argColor = getNationalColor('ARG');
      expect(argColor).toHaveProperty('primary');
      expect(argColor).toHaveProperty('bg');
      expect(argColor.primary).toBe('#74ACDF');
    });

    it('should return DEFAULT color for unknown team code', () => {
      const unknownColor = getNationalColor('XXX');
      expect(unknownColor).toEqual(NATIONAL_COLORS.DEFAULT);
    });

    it('should normalize team code to uppercase', () => {
      const lowerCase = getNationalColor('arg');
      const upperCase = getNationalColor('ARG');
      expect(lowerCase).toEqual(upperCase);
    });

    it('should never throw exception for any string input', () => {
      expect(() => getNationalColor('')).not.toThrow();
      expect(() => getNationalColor('invalid')).not.toThrow();
      expect(() => getNationalColor('123')).not.toThrow();
    });

    it('should ensure bg opacity is <= 0.15 for all defined teams', () => {
      Object.entries(NATIONAL_COLORS).forEach(([code, color]) => {
        if (code !== 'DEFAULT') {
          const match = color.bg.match(/rgba\(\d+,\d+,\d+,([\d.]+)\)/);
          if (match) {
            const opacity = parseFloat(match[1]);
            expect(opacity).toBeLessThanOrEqual(0.15);
          }
        }
      });
    });
  });

  describe('getGreeting', () => {
    it('should return "Buenos días" for hours 6-11', () => {
      expect(getGreeting(6)).toBe('Buenos días');
      expect(getGreeting(9)).toBe('Buenos días');
      expect(getGreeting(11)).toBe('Buenos días');
    });

    it('should return "Buenas tardes" for hours 12-19', () => {
      expect(getGreeting(12)).toBe('Buenas tardes');
      expect(getGreeting(15)).toBe('Buenas tardes');
      expect(getGreeting(19)).toBe('Buenas tardes');
    });

    it('should return "Buenas noches" for hours 20-23 and 0-5', () => {
      expect(getGreeting(20)).toBe('Buenas noches');
      expect(getGreeting(23)).toBe('Buenas noches');
      expect(getGreeting(0)).toBe('Buenas noches');
      expect(getGreeting(5)).toBe('Buenas noches');
    });

    it('should always return a non-empty string', () => {
      for (let hour = 0; hour < 24; hour++) {
        const greeting = getGreeting(hour);
        expect(greeting).toBeTruthy();
        expect(typeof greeting).toBe('string');
        expect(greeting.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getFlagEmoji', () => {
    it('should return correct emoji for known team code', () => {
      expect(getFlagEmoji('ARG')).toBe('🇦🇷');
      expect(getFlagEmoji('BRA')).toBe('🇧🇷');
    });

    it('should return DEFAULT emoji for unknown team code', () => {
      expect(getFlagEmoji('XXX')).toBe('🏳️');
    });

    it('should normalize team code to uppercase', () => {
      expect(getFlagEmoji('arg')).toBe('🇦🇷');
      expect(getFlagEmoji('ArG')).toBe('🇦🇷');
    });
  });
});
