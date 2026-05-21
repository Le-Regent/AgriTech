'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { useOffline } from '@/context/OfflineContext';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/constants';
import { toast } from 'sonner';

export type SortOption = 'name-asc' | 'price-low' | 'price-high';

export interface FilterState {
  category: string;
  origin: string;
  certification: string[];
  season: string;
  healthStatus: string;
}

export function useMarketplace() {
  const { isOnline, saveToCache, getFromCache } = useOffline();
  const searchParams = useSearchParams();
  
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || 'All Produce',
    origin: 'All',
    certification: [],
    season: 'All',
    healthStatus: 'All',
  });

  const productsRef = useRef<Product[]>(allProducts);
  useEffect(() => { productsRef.current = allProducts; }, [allProducts]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilters(prev => ({ ...prev, category: cat }));
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    const cachedProducts = await getFromCache('marketplace_products');
    if (cachedProducts) {
      setAllProducts(cachedProducts);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (isOnline) {
        const data = await supabaseService.getProducts();
        if (data && data.length > 0) {
          const mappedProducts: Product[] = data.map((p: any) => ({
            id: p.id,
            farmer_id: p.farmer_id,
            name: p.name,
            price: p.price,
            unit: p.unit,
            location: p.location || 'Unknown',
            image_url: p.image_url || 'https://picsum.photos/seed/product/400/300',
            is_verified: p.is_verified,
            health_status: p.health_status || 'N/A',
            certifications: p.certifications || [],
            harvest_season: p.harvest_season || 'Year round',
            category: p.category,
            description: p.description || '',
            stock_quantity: p.stock_quantity || 0,
            created_at: p.created_at,
            profiles: p.profiles
          }));
          setAllProducts(mappedProducts);
          saveToCache('marketplace_products', mappedProducts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      if (!productsRef.current.length || productsRef.current === INITIAL_PRODUCTS) {
        setAllProducts(INITIAL_PRODUCTS);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, getFromCache, saveToCache]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchTerm(search);
  }, [searchParams]);

  const filteredProducts = allProducts.filter(p => {
    if (filters.category !== 'All Produce' && p.category !== filters.category) return false;
    if (filters.origin !== 'All' && p.location !== filters.origin) return false;
    if (filters.season !== 'All' && p.harvest_season !== filters.season) return false;
    if (filters.healthStatus !== 'All' && p.health_status !== filters.healthStatus) return false;
    if (filters.certification.length > 0 && !filters.certification.every(c => p.certifications.includes(c))) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(searchLower) || (p.description || '').toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  return {
    allProducts,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortedProducts,
    fetchProducts,
    setAllProducts
  };
}
