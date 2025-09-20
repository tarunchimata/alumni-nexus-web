import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type School } from '@/lib/apiTransforms';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<School>();

interface SchoolsDataGridProps {
  schools: School[];
  loading?: boolean;
  totalCount?: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onApprove: (schoolId: number) => Promise<void>;
  onEdit: (school: School) => void;
  onDelete: (schoolId: number) => Promise<void>;
  onValidate: (schoolId: number) => Promise<void>;
}

export const SchoolsDataGrid: React.FC<SchoolsDataGridProps> = ({
  schools,
  loading = false,
  totalCount = 0,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onApprove,
  onEdit,
  onDelete,
  onValidate
}) => {
  const permissions = usePermissions();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />Active
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
          <AlertCircle className="w-3 h-3 mr-1" />Pending
        </Badge>;
      case 'rejected':
      case 'inactive':
        return <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('schoolName', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            School Name
            {column.getIsSorted() === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
            {column.getIsSorted() === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
            {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        ),
        cell: ({ getValue, row }) => (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{getValue()}</div>
            {row.original.udiseCode && (
              <div className="text-xs text-muted-foreground">UDISE: {row.original.udiseCode}</div>
            )}
          </div>
        ),
        enableSorting: true,
      }),
      
      columnHelper.accessor('stateName', {
        header: 'State',
        cell: ({ getValue }) => getValue() || 'N/A',
        enableSorting: true,
      }),
      
      columnHelper.accessor('districtName', {
        header: 'District', 
        cell: ({ getValue }) => getValue() || 'N/A',
        enableSorting: true,
      }),
      
      columnHelper.accessor('management', {
        header: 'Management',
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <Badge variant="outline" className="capitalize">
              {value || 'N/A'}
            </Badge>
          );
        },
        enableSorting: true,
      }),
      
      columnHelper.accessor('status', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Status
            {column.getIsSorted() === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
            {column.getIsSorted() === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
            {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        ),
        cell: ({ getValue }) => getStatusBadge(getValue() || ''),
        enableSorting: true,
      }),
      
      columnHelper.accessor('userCount', {
        header: 'Users',
        cell: ({ getValue }) => (
          <div className="text-center font-medium">
            {getValue() || 0}
          </div>
        ),
        enableSorting: true,
      }),
      
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const school = row.original;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permissions.canApproveSchools() && school.status?.toLowerCase() === 'pending' && school.id && (
                  <DropdownMenuItem
                    onClick={() => onApprove(Number(school.id))}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                )}
                
                {permissions.canApproveSchools() && school.id && (
                  <DropdownMenuItem
                    onClick={() => onValidate(Number(school.id))}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Validate
                  </DropdownMenuItem>
                )}
                
                {permissions.canEditSchools() && (
                  <DropdownMenuItem onClick={() => onEdit(school)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                
                {permissions.canDeleteSchools() && school.id && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(Number(school.id))}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }),
    ],
    [permissions, onApprove, onEdit, onDelete, onValidate]
  );

  const table = useReactTable({
    data: schools,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const exportToCSV = () => {
    const csvData = schools.map(school => ({
      'School Name': school.schoolName,
      'UDISE Code': school.udiseCode || '',
      'State': school.stateName || '',
      'District': school.districtName || '',
      'Management': school.management || '',
      'Status': school.status || '',
      'User Count': school.userCount || 0,
      'Created At': school.createdAt || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schools_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Schools data exported to CSV');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <CardTitle className="text-xl font-semibold">Schools Directory</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-full md:w-[300px]"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={schools.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) => 
              table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn('management')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('management')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="aided">Aided</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <div className="h-6 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      row.getIsSelected() && "bg-muted"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No schools found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[25, 50, 100, 200].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
              </p>
              <p className="text-sm text-muted-foreground">
                ({totalCount.toLocaleString()} total schools)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(Math.ceil(totalCount / pageSize))}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};