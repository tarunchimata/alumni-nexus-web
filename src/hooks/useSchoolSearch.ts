/**
 * Enhanced School Search Hook
 * Provides powerful search capabilities with filters and real-time results
 */

import { useState, useCallback, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { useDebounce } from './useDebounce';

interface SearchFilters {
  state?: string;
  district?: string;
  status?: string;
  management?: string;
  school_type?: string;
  limit?: number;
}

interface SearchResult {
  schools: any[];
  summary?: any;
  pagination?: any;
}

export const useSchoolSearch = (initialFilters?: SearchFilters) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  const [results, setResults] = useState<SearchResult>({ schools: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchTerm: string, searchFilters: SearchFilters) => {
    if (!searchTerm.trim()) {
      setResults({ schools: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useSchoolSearch] Performing search:', { searchTerm, searchFilters });
      const data = await apiService.searchSchools(searchTerm, searchFilters);
      setResults(data);
      console.log('[useSchoolSearch] Search completed, found', data.schools.length, 'schools');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('[useSchoolSearch] Search error:', errorMessage);
      setError(errorMessage);
      setResults({ schools: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, filters);
    } else {
      setResults({ schools: [] });
    }
  }, [debouncedQuery, filters, performSearch]);

  const search = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({ schools: [] });
    setError(null);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters || {});
  }, [initialFilters]);

  return {
    query,
    filters,
    results: results.schools,
    summary: results.summary,
    pagination: results.pagination,
    loading,
    error,
    search,
    updateFilters,
    clearSearch,
    clearFilters,
    hasResults: results.schools.length > 0,
    totalResults: results.summary?.totalSchools || results.schools.length
  };
};