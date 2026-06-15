import { describe, it, expect } from 'vitest';
import { convertQuantity, getAvailableUnits, formatUnit } from '../unitUtils';

describe('unitUtils', () => {
  describe('convertQuantity', () => {
    it('should correctly convert kg to g', () => {
      expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
    });

    it('should correctly convert ton to kg', () => {
      expect(convertQuantity(1, 'ton', 'kg')).toBe(1000);
    });

    it('should correctly convert bag to kg', () => {
      expect(convertQuantity(1, 'bag', 'kg')).toBe(50);
    });

    it('should return original quantity if unit is unknown', () => {
      expect(convertQuantity(10, 'unknown', 'kg')).toBe(10);
    });

    it('should handle space and case correctly', () => {
      expect(convertQuantity(1, 'Mesh Bag', 'kg')).toBe(25);
    });

    it('should correctly convert crate to kg', () => {
      expect(convertQuantity(1, 'crate', 'kg')).toBe(20);
    });

    it('should correctly convert bucket to kg', () => {
      expect(convertQuantity(1, 'bucket', 'kg')).toBe(15);
    });

    it('should correctly convert liter to g', () => {
      expect(convertQuantity(1, 'liter', 'g')).toBe(1000);
    });

    it('should correctly convert ton to liter', () => {
      expect(convertQuantity(1, 'ton', 'liter')).toBe(1000);
    });

    it('should correctly convert bottle to kg', () => {
      expect(convertQuantity(1, 'bottle', 'kg')).toBe(1);
    });

    it('should correctly convert jerrycan to liter', () => {
      expect(convertQuantity(1, 'jerrycan', 'liter')).toBe(5);
    });
  });

  describe('getAvailableUnits', () => {
    it('should return weight-based units for kg', () => {
      const units = getAvailableUnits('kg');
      expect(units).toContain('ton');
      expect(units).toContain('bag');
    });

    it('should return volume-based units for liter', () => {
      const units = getAvailableUnits('liter');
      expect(units).toContain('bottle');
      expect(units).toContain('jerrycan');
    });

    it('should return discrete units for bunch', () => {
      expect(getAvailableUnits('bunch')).toEqual(['bunch']);
    });
  });

  describe('formatUnit', () => {
    it('should format snake_case units correctly', () => {
      expect(formatUnit('mesh_bag')).toBe('Mesh Bag');
    });

    it('should handle simple units', () => {
      expect(formatUnit('kg')).toBe('Kg');
    });
  });
});
