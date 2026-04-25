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
  limit?: string;
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
      // Convert string filters to number for searchSchools
      const numericFilters = {
        state: searchFilters.state,
        district: searchFilters.district,
        status: searchFilters.status,
        limit: searchFilters.limit ? parseInt(searchFilters.limit) : undefined
      };
      const data = await apiService.searchSchools(searchTerm, numericFilters);
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

  // Fetch all schools (paginated)
  const fetchAll = useCallback(async (limit: number = 25) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useSchoolSearch] Fetching all schools, limit:', limit);
      const data = await apiService.getSchoolsPaginated(1, limit);
      setResults(data);
      console.log('[useSchoolSearch] Fetch all completed, found', data.schools.length, 'schools');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schools';
      console.error('[useSchoolSearch] Fetch all error:', errorMessage);
      setError(errorMessage);
      setResults({ schools: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch schools by filters
  const fetchByFilters = useCallback(async (fetchFilters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useSchoolSearch] Fetching by filters:', fetchFilters);
      // Use getSchools which expects string parameters
      const data = await apiService.getSchools(fetchFilters);
      setResults(data);
      console.log('[useSchoolSearch] Fetch by filters completed, found', data.schools.length, 'schools');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schools';
      console.error('[useSchoolSearch] Fetch by filters error:', errorMessage);
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
    fetchAll,
    fetchByFilters,
    updateFilters,
    clearSearch,
    clearFilters,
    hasResults: results.schools.length > 0,
    totalResults: results.summary?.totalSchools || results.schools.length
  };
};