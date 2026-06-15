export type Unit = 'kg' | 'g' | 'ton' | 'bag' | 'bucket' | 'crate' | 'bunch' | 'jerrycan' | 'bottle' | 'liter' | 'mesh_bag' | 'heap' | 'piece';

export const UNIT_CONVERSIONS: Record<Unit, Record<Unit, number>> = {
  kg: {
    kg: 1,
    g: 1000,
    ton: 0.001,
    bag: 0.02, // 50kg bag
    bucket: 0.066, // approx 15kg bucket
    crate: 0.05, // approx 20kg crate
    bunch: 1,
    jerrycan: 0.2, // approx 5kg/L
    bottle: 1,
    liter: 1,
    mesh_bag: 0.04, // approx 25kg
    heap: 1,
    piece: 1,
  },
  g: {
    kg: 0.001,
    g: 1,
    ton: 0.000001,
    bag: 0.00002,
    bucket: 0.000066,
    crate: 0.00005,
    bunch: 1,
    jerrycan: 0.0002,
    bottle: 0.001,
    liter: 0.001,
    mesh_bag: 0.00004,
    heap: 1,
    piece: 1,
  },
  ton: {
    kg: 1000,
    g: 1000000,
    ton: 1,
    bag: 20,
    bucket: 66,
    crate: 50,
    bunch: 1,
    jerrycan: 200,
    bottle: 1000,
    liter: 1000,
    mesh_bag: 40,
    heap: 1,
    piece: 1,
  },
  bag: {
    kg: 50,
    g: 50000,
    ton: 0.05,
    bag: 1,
    bucket: 3.3,
    crate: 2.5,
    bunch: 1,
    jerrycan: 10,
    bottle: 50,
    liter: 50,
    mesh_bag: 2,
    heap: 1,
    piece: 1,
  },
  bucket: {
    kg: 15,
    g: 15000,
    ton: 0.015,
    bag: 0.3,
    bucket: 1,
    crate: 0.75,
    bunch: 1,
    jerrycan: 3,
    bottle: 15,
    liter: 15,
    mesh_bag: 0.6,
    heap: 1,
    piece: 1,
  },
  crate: {
    kg: 20,
    g: 20000,
    ton: 0.02,
    bag: 0.4,
    bucket: 1.33,
    crate: 1,
    bunch: 1,
    jerrycan: 4,
    bottle: 20,
    liter: 20,
    mesh_bag: 0.8,
    heap: 1,
    piece: 1,
  },
  bunch: { kg: 1, g: 1, ton: 1, bag: 1, bucket: 1, crate: 1, bunch: 1, jerrycan: 1, bottle: 1, liter: 1, mesh_bag: 1, heap: 1, piece: 1 },
  jerrycan: {
    kg: 5,
    g: 5000,
    ton: 0.005,
    bag: 0.1,
    bucket: 0.33,
    crate: 0.25,
    bunch: 1,
    jerrycan: 1,
    bottle: 5,
    liter: 5,
    mesh_bag: 0.2,
    heap: 1,
    piece: 1,
  },
  bottle: {
    kg: 1,
    g: 1000,
    ton: 0.001,
    bag: 0.02,
    bucket: 0.066,
    crate: 0.05,
    bunch: 1,
    jerrycan: 0.2,
    bottle: 1,
    liter: 1,
    mesh_bag: 0.04,
    heap: 1,
    piece: 1,
  },
  liter: {
    kg: 1,
    g: 1000,
    ton: 0.001,
    bag: 0.02,
    bucket: 0.066,
    crate: 0.05,
    bunch: 1,
    jerrycan: 0.2,
    bottle: 1,
    liter: 1,
    mesh_bag: 0.04,
    heap: 1,
    piece: 1,
  },
  mesh_bag: {
    kg: 25,
    g: 25000,
    ton: 0.025,
    bag: 0.5,
    bucket: 1.66,
    crate: 1.25,
    bunch: 1,
    jerrycan: 5,
    bottle: 25,
    liter: 25,
    mesh_bag: 1,
    heap: 1,
    piece: 1,
  },
  heap: { kg: 1, g: 1, ton: 1, bag: 1, bucket: 1, crate: 1, bunch: 1, jerrycan: 1, bottle: 1, liter: 1, mesh_bag: 1, heap: 1, piece: 1 },
  piece: { kg: 1, g: 1, ton: 1, bag: 1, bucket: 1, crate: 1, bunch: 1, jerrycan: 1, bottle: 1, liter: 1, mesh_bag: 1, heap: 1, piece: 1 },
};

export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (!fromUnit || !toUnit) return quantity;
  
  const from = fromUnit.toLowerCase().replace(' ', '_') as Unit;
  const to = toUnit.toLowerCase().replace(' ', '_') as Unit;

  if (UNIT_CONVERSIONS[from] && UNIT_CONVERSIONS[from][to]) {
    return quantity * UNIT_CONVERSIONS[from][to];
  }

  return quantity;
}

export function getAvailableUnits(baseUnit: string): Unit[] {
  if (!baseUnit) return ['kg']; // Default to kg if unit is missing
  const base = baseUnit.toLowerCase().replace(' ', '_');
  
  // Weight-based units
  if (['kg', 'g', 'ton', 'bag', 'bucket', 'crate', 'mesh_bag'].includes(base)) {
    return ['kg', 'g', 'ton', 'bag', 'bucket', 'crate', 'mesh_bag'];
  }
  
  // Volume-based units
  if (['liter', 'bottle', 'jerrycan'].includes(base)) {
    return ['liter', 'bottle', 'jerrycan'];
  }
  
  // Discrete units
  if (base === 'bunch') return ['bunch'];
  if (base === 'heap') return ['heap'];
  if (base === 'piece') return ['piece', 'heap'];
  
  return [base as Unit];
}

export function formatUnit(unit: string): string {
  if (!unit) return '';
  return unit
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
