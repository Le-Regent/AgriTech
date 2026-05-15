import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../supabaseService';
import { supabase } from '../../lib/supabase';

const mockFrom = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

describe('supabaseService Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.insert.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.order.mockReturnThis();
    mockFrom.single.mockReturnThis();
    mockFrom.limit.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
  });

  it('should get waste logs', async () => {
    const mockLogs = { data: [{ id: 'w1', volume: 5 }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockLogs).then(onFullfilled);

    const result = await supabaseService.getWasteLogs('f1');
    expect(result).toEqual(mockLogs.data);
  });

  it('should create waste log', async () => {
    const mockLog = { data: { id: 'w1' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockLog).then(onFullfilled);

    const result = await supabaseService.createWasteLog({ volume: 5 });
    expect(result).toEqual(mockLog.data);
  });

  it('should get product reviews', async () => {
    const mockReviews = { data: [{ id: 'r1', rating: 5 }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockReviews).then(onFullfilled);

    const result = await supabaseService.getProductReviews('p1');
    expect(result).toEqual(mockReviews.data);
  });

  it('should create review', async () => {
    const mockReview = { data: { id: 'r1' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockReview).then(onFullfilled);

    const result = await supabaseService.createReview({ product_id: 'p1', rating: 5 });
    expect(result).toEqual(mockReview.data);
  });

  it('should get diagnoses', async () => {
    const mockDiagnoses = { data: [{ id: 'd1', result: 'Healthy' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockDiagnoses).then(onFullfilled);

    const result = await supabaseService.getDiagnoses('f1');
    expect(result).toEqual(mockDiagnoses.data);
  });

  it('should create diagnosis', async () => {
    const mockDiagnosis = { data: { id: 'd1' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockDiagnosis).then(onFullfilled);

    const result = await supabaseService.createDiagnosis({ farmer_id: 'f1' });
    expect(result).toEqual(mockDiagnosis.data);
  });
});
