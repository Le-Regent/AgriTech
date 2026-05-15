import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../supabase';

describe('supabase client', () => {
  it('should be initialized with URL and Key', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.storage).toBeDefined();
  });

  it('should have basic methods for querying', () => {
    const table = supabase.from('profiles');
    expect(table.select).toBeDefined();
    expect(table.insert).toBeDefined();
    expect(table.update).toBeDefined();
    expect(table.delete).toBeDefined();
  });
});
