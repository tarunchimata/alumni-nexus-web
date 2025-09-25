/**
 * School Form Modal Component
 * Provides create and edit functionality for schools
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { School } from '@/lib/apiTransforms';

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
    id: '',
    schoolName: '',
    udiseCode: null,
    stateName: '',
    districtName: '',
    blockName: null,
    institutionId: '',
    schoolType: null,
    management: null,
    status: 'active',
    createdAt: '',
    updatedAt: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (school && mode === 'edit') {
      setFormData(school);
    } else {
      setFormData({
        id: '',
        schoolName: '',
        udiseCode: null,
        stateName: '',
        districtName: '',
        blockName: null,
        institutionId: '',
        schoolType: null,
        management: null,
        status: 'active',
        createdAt: '',
        updatedAt: ''
      });
    }
  }, [school, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.schoolName || !formData.stateName || !formData.districtName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      if (mode === 'create') {
        await apiService.createSchool(formData);
        toast.success('School created successfully');
      } else {
        await apiService.updateSchool(school!.id!, formData);
        toast.success('School updated successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('School operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof School, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New School' : 'Edit School'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={formData.udiseCode || ''}
                onChange={(e) => handleInputChange('udiseCode', e.target.value || null)}
                placeholder="Enter UDISE code"
              />
            </div>

            <div>
              <Label htmlFor="blockName">Block</Label>
              <Input
                id="blockName"
                value={formData.blockName || ''}
                onChange={(e) => handleInputChange('blockName', e.target.value || null)}
                placeholder="Enter block name"
              />
            </div>

            <div>
              <Label htmlFor="stateName">State *</Label>
              <Select
                value={formData.stateName}
                onValueChange={(value) => handleInputChange('stateName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                  <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Karnataka">Karnataka</SelectItem>
                  <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                </SelectContent>
              </Select>
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
                value={formData.blockName || ''}
                onChange={(e) => handleInputChange('blockName', e.target.value || null)}
                placeholder="Enter block name"
              />
            </div>

            <div>
              <Label htmlFor="institutionId">Institution ID</Label>
              <Input
                id="institutionId"
                value={formData.institutionId}
                onChange={(e) => handleInputChange('institutionId', e.target.value)}
                placeholder="Enter institution ID"
              />
            </div>

            <div>
              <Label htmlFor="schoolType">School Type</Label>
              <Select
                value={formData.schoolType || ''}
                onValueChange={(value) => handleInputChange('schoolType', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Upper Primary">Upper Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                  <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="management">Management Type</Label>
              <Select
                value={formData.management || ''}
                onValueChange={(value) => handleInputChange('management', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select management type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Aided">Aided</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create School' : 'Update School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};