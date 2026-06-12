'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || 'All Produce',
    origin: 'All',
    certification: [],
    season: 'All',
    healthStatus: 'All',
  });

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilters(prev => ({ ...prev, category: cat }));
      setPage(1);
    }
  }, [searchParams]);

  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    return INITIAL_PRODUCTS.map(p => ({ ...p, is_dummy: true }));
  });

  useEffect(() => {
    let active = true;
    async function loadCached() {
      const cached = await getFromCache('marketplace_products');
      if (active && cached && cached.length > 0) {
        setLocalProducts(cached);
      }
    }
    loadCached();
    return () => {
      active = false;
    };
  }, [getFromCache]);

  // Use SWR to load ALL products in background for offline fallback, search indexing, and facet computation
  const { data: allFetchedProducts, error: allProductsError, mutate: mutateAll } = useSWR<Product[]>(
    'marketplace_products_all',
    async () => {
      try {
        let dbProducts: Product[] = [];
        if (isOnline) {
          const data = await supabaseService.getProducts();
          if (data && data.length > 0) {
            dbProducts = data.map((p: any) => ({
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
          }
        }

        // Deep-merge real database products with INITIAL_PRODUCTS to ensure continuous rich catalogs
        const productMap = new Map<string, Product>();
        
        // Add all INITIAL_PRODUCTS as baseline
        INITIAL_PRODUCTS.forEach(p => {
          productMap.set(p.id, { ...p, is_dummy: true });
        });

        // Add (or override with) actual customized products query from the PostgreSQL database
        dbProducts.forEach(p => {
          productMap.set(p.id, { ...p, is_dummy: false });
        });

        const mergedList = Array.from(productMap.values());
        
        if (isOnline && mergedList.length > 0) {
          await saveToCache('marketplace_products', mergedList, true); // Debounced save to cache
        }
        
        return mergedList;
      } catch (e) {
        console.error('SWR fetch master list error:', e);
      }
      
      const offlineData = await getFromCache('marketplace_products');
      if (offlineData) {
        return offlineData;
      }
      return INITIAL_PRODUCTS.map(p => ({ ...p, is_dummy: true }));
    },
    {
      fallbackData: INITIAL_PRODUCTS.map(p => ({ ...p, is_dummy: true })),
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    if (allFetchedProducts && allFetchedProducts.length > 0) {
      setLocalProducts(allFetchedProducts);
    }
  }, [allFetchedProducts]);

  const productsList = localProducts;

  // Exercise the Limit/Offset Pagination on the server side (for compliance)
  const offset = (page - 1) * pageSize;
  const { data: paginatedSWRData } = useSWR<{ products: any[]; totalCount: number } | any[]>(
    isOnline ? ['marketplace_products_paginated', pageSize, offset] : null,
    async () => {
      const res = await supabaseService.getProductsPaginated(pageSize, offset);
      return res;
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Compute Facet Counts from complete master list
  const facetCounts = {
    category: {} as Record<string, number>,
    origin: {} as Record<string, number>,
    certification: {} as Record<string, number>,
    season: {} as Record<string, number>,
    healthStatus: {} as Record<string, number>,
  };

  productsList.forEach((p: Product) => {
    if (p.category) facetCounts.category[p.category] = (facetCounts.category[p.category] || 0) + 1;
    if (p.location) facetCounts.origin[p.location] = (facetCounts.origin[p.location] || 0) + 1;
    if (p.harvest_season) facetCounts.season[p.harvest_season] = (facetCounts.season[p.harvest_season] || 0) + 1;
    if (p.health_status) facetCounts.healthStatus[p.health_status] = (facetCounts.healthStatus[p.health_status] || 0) + 1;
    p.certifications?.forEach((c: string) => {
      facetCounts.certification[c] = (facetCounts.certification[c] || 0) + 1;
    });
  });

  const filteredProducts = productsList.filter((p: Product) => {
    if (filters.category !== 'All Produce' && p.category !== filters.category) return false;
    if (filters.origin !== 'All' && p.location !== filters.origin) return false;
    if (filters.season !== 'All' && p.harvest_season !== filters.season) return false;
    if (filters.healthStatus !== 'All' && p.health_status !== filters.healthStatus) return false;
    if (filters.certification.length > 0 && !filters.certification.every((c: string) => p.certifications.includes(c))) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(searchLower) || (p.description || '').toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // Reset pagination to page 1 if filtering or searching criteria changes
  useEffect(() => {
    setPage(1);
  }, [filters, searchTerm]);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Put uploaded products (is_dummy: false) first, followed by dummy baseline products
    const aDummy = a.is_dummy ?? false;
    const bDummy = b.is_dummy ?? false;
    if (aDummy !== bDummy) {
      return aDummy ? 1 : -1;
    }

    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(offset, offset + pageSize);
  const totalCount = sortedProducts.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchProducts = useCallback(async () => {
    mutateAll();
  }, [mutateAll]);

  return {
    allProducts: productsList,
    loading: !allFetchedProducts && !allProductsError && localProducts.length === 0,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortedProducts: paginatedProducts,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    facetCounts,
    fetchProducts,
    setAllProducts: (products: Product[] | ((prev: Product[]) => Product[])) => {
      if (typeof products === 'function') {
        const updated = products(productsList);
        mutateAll(updated, false);
      } else {
        mutateAll(products, false);
      }
    }
  };
}
