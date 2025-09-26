import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { SchoolFilters } from '@/hooks/useSchoolsQuery';

interface DynamicSchoolFiltersProps {
  filters: SchoolFilters;
  searchInput: string;
  onFilterChange: (key: keyof SchoolFilters, value: any) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  statesOptions: Array<{ value: string; label: string; count: number }>;
  districtsOptions: Array<{ value: string; label: string; count: number }>;
  managementOptions: Array<{ value: string; label: string; count: number }>;
  schoolTypeOptions: Array<{ value: string; label: string; count: number }>;
  statusOptions: Array<{ value: string; label: string; count: number }>;
  loading?: boolean;
}

export const DynamicSchoolFilters: React.FC<DynamicSchoolFiltersProps> = ({
  filters,
  searchInput,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onRefresh,
  statesOptions = [],
  districtsOptions = [],
  managementOptions = [],
  schoolTypeOptions = [],
  statusOptions = [],
  loading = false
}) => {
  const hasActiveFilters = filters.state || filters.district || filters.management || 
                          filters.schoolType || filters.status || searchInput;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Refresh */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search schools by name, UDISE code, or district..."
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* State Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select
                value={filters.state || 'all'}
                onValueChange={(value) => onFilterChange('state', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All States</SelectItem>
                  {statesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District Filter - Dynamic based on state */}
            <div className="space-y-2">
              <label className="text-sm font-medium">District</label>
              <Select
                value={filters.district || 'all'}
                onValueChange={(value) => onFilterChange('district', value === 'all' ? undefined : value)}
                disabled={!filters.state || filters.state === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !filters.state || filters.state === 'all' 
                      ? "Select state first" 
                      : "All Districts"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All Districts</SelectItem>
                  {districtsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Management Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Management</label>
              <Select
                value={filters.management || 'all'}
                onValueChange={(value) => onFilterChange('management', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Management" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All Management</SelectItem>
                  {managementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* School Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">School Type</label>
              <Select
                value={filters.schoolType || 'all'}
                onValueChange={(value) => onFilterChange('schoolType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All Types</SelectItem>
                  {schoolTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">Actions</label>
              <Button
                variant="outline"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {searchInput && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchInput}"
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onSearchChange('')}
                  />
                </Badge>
              )}
              {filters.state && (
                <Badge variant="secondary" className="gap-1">
                  State: {filters.state}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onFilterChange('state', undefined)}
                  />
                </Badge>
              )}
              {filters.district && (
                <Badge variant="secondary" className="gap-1">
                  District: {filters.district}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onFilterChange('district', undefined)}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onFilterChange('status', undefined)}
                  />
                </Badge>
              )}
              {filters.management && (
                <Badge variant="secondary" className="gap-1">
                  Management: {filters.management}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onFilterChange('management', undefined)}
                  />
                </Badge>
              )}
              {filters.schoolType && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.schoolType}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onFilterChange('schoolType', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};