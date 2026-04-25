import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

interface SchoolsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: any;
}

export const SchoolsExportModal = ({ isOpen, onClose, currentFilters }: SchoolsExportModalProps) => {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [includeStats, setIncludeStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Build query params from current filters
      const params = new URLSearchParams();
      if (currentFilters?.state) params.append('state', currentFilters.state);
      if (currentFilters?.district) params.append('district', currentFilters.district);
      if (currentFilters?.status) params.append('status', currentFilters.status);
      if (currentFilters?.management) params.append('management', currentFilters.management);
      if (currentFilters?.type) params.append('type', currentFilters.type);
      if (currentFilters?.search) params.append('search', currentFilters.search);
      params.append('format', format);
      params.append('includeStats', String(includeStats));
      
      const endpoint = `/api/schools/export?${params.toString()}`;
      console.log('[Export] Requesting:', endpoint);
      
      const response = await apiService.get<{ data: string; filename: string }>(endpoint);
      
      if (response?.data) {
        // Create blob and download
        const blob = new Blob([response.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || `schools-export-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Exported ${format.toUpperCase()} successfully`);
        onClose();
      } else {
        throw new Error('No data received');
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('Failed to export schools data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Schools Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'excel')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeStats" 
              checked={includeStats}
              onCheckedChange={(checked) => setIncludeStats(!!checked)}
            />
            <Label 
              htmlFor="includeStats" 
              className="text-sm font-normal cursor-pointer"
            >
              Include user and class statistics
            </Label>
          </div>

          {currentFilters && Object.keys(currentFilters).length > 0 && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">Active Filters:</p>
              <ul className="list-disc list-inside space-y-1">
                {currentFilters.state && <li>State: {currentFilters.state}</li>}
                {currentFilters.district && <li>District: {currentFilters.district}</li>}
                {currentFilters.status && <li>Status: {currentFilters.status}</li>}
                {currentFilters.management && <li>Management: {currentFilters.management}</li>}
                {currentFilters.type && <li>Type: {currentFilters.type}</li>}
                {currentFilters.search && <li>Search: {currentFilters.search}</li>}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
