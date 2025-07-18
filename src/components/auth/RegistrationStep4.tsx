import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CheckCircle, User, Building, Mail, Phone, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RegistrationStep4Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const RegistrationStep4 = ({ data, onComplete, onBack, isLoading }: RegistrationStep4Props) => {
  const [formData, setFormData] = useState({
    role: data.role || '',
    acceptTerms: data.acceptTerms || false,
  });

  const [errors, setErrors] = useState<any>({});

  const roles = [
    {
      value: 'student',
      label: 'Student',
      description: 'Currently studying at this institution',
      icon: User,
    },
    {
      value: 'teacher',
      label: 'Teacher/Faculty',
      description: 'Teaching or working at this institution',
      icon: UserCheck,
    },
    {
      value: 'alumni',
      label: 'Alumni',
      description: 'Former student of this institution',
      icon: Building,
    },
  ];

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
    if (errors.role) {
      setErrors((prev: any) => ({ ...prev, role: '' }));
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, acceptTerms: checked }));
    if (errors.acceptTerms) {
      setErrors((prev: any) => ({ ...prev, acceptTerms: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-lg font-semibold">Almost Done!</h3>
        <p className="text-muted-foreground">
          Just a few final details to complete your registration
        </p>
      </div>

      {/* Registration Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Registration Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{data.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>{data.institutionName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What is your role at this institution?</Label>
        <RadioGroup value={formData.role} onValueChange={handleRoleChange}>
          <div className="space-y-3">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <label
                  key={role.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    formData.role === role.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <RadioGroupItem value={role.value} className="mt-1" />
                  <IconComponent className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{role.label}</div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </RadioGroup>
        {errors.role && (
          <p className="text-destructive text-sm">{errors.role}</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={handleTermsChange}
            className="mt-1"
          />
          <div className="text-sm">
            <Label htmlFor="terms" className="cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </Label>
            {errors.acceptTerms && (
              <p className="text-destructive text-sm mt-1">{errors.acceptTerms}</p>
            )}
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Account Approval Required</p>
                <p>
                  Your account will be pending approval from your institution's admin. 
                  You'll receive an email notification once your account is activated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="min-w-32"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Complete Registration
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};