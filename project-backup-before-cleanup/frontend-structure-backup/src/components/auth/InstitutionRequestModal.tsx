import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, MapPin, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstitutionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
  userName: string;
}

export const InstitutionRequestModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userEmail, 
  userName 
}: InstitutionRequestModalProps) => {
  const [formData, setFormData] = useState({
    institution_name: '',
    city: '',
    state: '',
    udise_code: '',
    additional_info: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.institution_name.trim()) {
      newErrors.institution_name = 'Institution name is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/institutions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          requester_email: userEmail,
          requester_name: userName,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Request submitted',
          description: result.message,
        });
        onSuccess();
        setFormData({
          institution_name: '',
          city: '',
          state: '',
          udise_code: '',
          additional_info: '',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Request failed',
          description: error.error || 'Failed to submit institution request',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Institution request error:', error);
      toast({
        title: 'Request failed',
        description: 'An error occurred while submitting your request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Request New Institution</span>
          </DialogTitle>
          <DialogDescription>
            We'll review your request and add the institution to our database if it's valid.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Institution Name *</span>
            </Label>
            <Input
              id="institutionName"
              placeholder="Enter the full name of your institution"
              value={formData.institution_name}
              onChange={(e) => handleInputChange('institution_name', e.target.value)}
              className={errors.institution_name ? 'border-destructive' : ''}
            />
            {errors.institution_name && (
              <p className="text-destructive text-sm">{errors.institution_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>City *</span>
              </Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-destructive text-sm">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>State *</span>
              </Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-destructive text-sm">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="udiseCode" className="flex items-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>UDISE Code (Optional)</span>
            </Label>
            <Input
              id="udiseCode"
              placeholder="Enter UDISE code if known"
              value={formData.udise_code}
              onChange={(e) => handleInputChange('udise_code', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              UDISE is a unique identification number for schools in India
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Any additional details about the institution..."
              value={formData.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};