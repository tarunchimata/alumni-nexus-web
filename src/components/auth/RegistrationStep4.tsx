
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Loader2, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface RegistrationStep4Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

const roles = [
  {
    value: 'student',
    title: 'Student',
    description: 'Current student at the institution',
    icon: GraduationCap,
    color: 'text-blue-600'
  },
  {
    value: 'teacher',
    title: 'Teacher',
    description: 'Faculty member or educator',
    icon: BookOpen,
    color: 'text-green-600'
  },
  {
    value: 'alumni',
    title: 'Alumni',
    description: 'Former student or graduate',
    icon: Users,
    color: 'text-purple-600'
  }
];

export const RegistrationStep4 = ({ data, onComplete, onBack, isLoading }: RegistrationStep4Props) => {
  const [selectedRole, setSelectedRole] = useState(data.role || '');
  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted || false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!selectedRole) {
      newErrors.role = 'Please select your role';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete({
        role: selectedRole,
        termsAccepted
      });
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (errors.role) {
      setErrors((prev: any) => ({ ...prev, role: '' }));
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    if (errors.terms) {
      setErrors((prev: any) => ({ ...prev, terms: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Almost Done!</h3>
        <p className="text-muted-foreground">
          Select your role and accept our terms to complete registration
        </p>
      </div>

      {/* Registration Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Registration Summary</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Institution:</span>
              <span className="text-right">{data.institutionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span>{data.username}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Select Your Role</Label>
        <div className="grid gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRole === role.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => handleRoleSelect(role.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedRole === role.value ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedRole === role.value ? 'text-primary' : role.color
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{role.title}</h4>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    {selectedRole === role.value && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {errors.role && (
          <p className="text-destructive text-sm">{errors.role}</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={handleTermsChange}
            className="mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
              I agree to the Terms and Conditions and Privacy Policy
            </Label>
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>• Your account will be reviewed and approved by administrators</p>
              <p>• You'll receive an email notification once approved</p>
              <p>• Approval typically takes 1-2 business days</p>
            </div>
          </div>
        </div>
        {errors.terms && (
          <p className="text-destructive text-sm">{errors.terms}</p>
        )}
      </div>

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <p className="font-medium text-orange-800 mb-1">Account Approval Required</p>
              <p className="text-orange-700">
                Your registration will be submitted for administrator approval. 
                You'll receive an email notification once your account is activated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          type="submit"
          disabled={isLoading || !selectedRole || !termsAccepted}
          className="min-w-40"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
