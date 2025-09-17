import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

interface School {
  id?: number;
  schoolName: string;
  udiseCode?: string;
  stateName: string;
  districtName: string;
  blockName?: string;
  institutionId?: string;
  schoolType?: string;
  managementType?: string;
  status?: string;
}

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  school?: School | null;
  mode: 'create' | 'edit';
}

export const SchoolFormModal: React.FC<SchoolFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  school,
  mode
}) => {
  const [formData, setFormData] = useState<School>({
    schoolName: school?.schoolName || '',
    udiseCode: school?.udiseCode || '',
    stateName: school?.stateName || '',
    districtName: school?.districtName || '',
    blockName: school?.blockName || '',
    institutionId: school?.institutionId || '',
    schoolType: school?.schoolType || '',
    managementType: school?.managementType || '',
    status: school?.status || 'pending'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.schoolName.trim() || !formData.stateName.trim() || !formData.districtName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await apiService.createSchool(formData);
        toast.success('School created successfully and sent for approval');
      } else {
        await apiService.updateSchool(school!.id!, formData);
        toast.success('School updated successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving school:', error);
      toast.error(mode === 'create' ? 'Failed to create school' : 'Failed to update school');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof School, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New School' : 'Edit School'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="schoolName">School Name *</Label>
            <Input
              id="schoolName"
              value={formData.schoolName}
              onChange={(e) => handleInputChange('schoolName', e.target.value)}
              placeholder="Enter school name"
              required
            />
          </div>

          <div>
            <Label htmlFor="udiseCode">UDISE Code</Label>
            <Input
              id="udiseCode"
              value={formData.udiseCode}
              onChange={(e) => handleInputChange('udiseCode', e.target.value)}
              placeholder="Enter UDISE code"
            />
          </div>

          <div>
            <Label htmlFor="stateName">State *</Label>
            <Input
              id="stateName"
              value={formData.stateName}
              onChange={(e) => handleInputChange('stateName', e.target.value)}
              placeholder="Enter state name"
              required
            />
          </div>

          <div>
            <Label htmlFor="districtName">District *</Label>
            <Input
              id="districtName"
              value={formData.districtName}
              onChange={(e) => handleInputChange('districtName', e.target.value)}
              placeholder="Enter district name"
              required
            />
          </div>

          <div>
            <Label htmlFor="blockName">Block</Label>
            <Input
              id="blockName"
              value={formData.blockName}
              onChange={(e) => handleInputChange('blockName', e.target.value)}
              placeholder="Enter block name"
            />
          </div>

          <div>
            <Label htmlFor="schoolType">School Type</Label>
            <Select value={formData.schoolType} onValueChange={(value) => handleInputChange('schoolType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select school type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="higher_secondary">Higher Secondary</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="managementType">Management Type</Label>
            <Select value={formData.managementType} onValueChange={(value) => handleInputChange('managementType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select management type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="aided">Aided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create School' : 'Update School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};