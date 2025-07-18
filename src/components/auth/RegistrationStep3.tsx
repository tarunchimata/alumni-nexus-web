import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Eye, EyeOff, User, Lock, Check, X } from 'lucide-react';

interface RegistrationStep3Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const RegistrationStep3 = ({ data, onNext, onBack, isLoading }: RegistrationStep3Props) => {
  const [formData, setFormData] = useState({
    username: data.username || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const passwordRequirements = [
    { text: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { text: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { text: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { text: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
    { text: 'Contains special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const getPasswordStrength = (password: string) => {
    const passedTests = passwordRequirements.filter(req => req.test(password)).length;
    return (passedTests / passwordRequirements.length) * 100;
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return { text: 'Weak', color: 'text-destructive' };
    if (strength < 80) return { text: 'Medium', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Account Setup</h3>
        <p className="text-muted-foreground">
          Choose your username and create a secure password
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Username</span>
          </Label>
          <Input
            id="username"
            placeholder="Choose a unique username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className={errors.username ? 'border-destructive' : ''}
          />
          {errors.username && (
            <p className="text-destructive text-sm">{errors.username}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Username can only contain letters, numbers, and underscores
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Password</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password}</p>
          )}

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Password strength:</span>
                <span className={`text-sm font-medium ${strengthInfo.color}`}>
                  {strengthInfo.text}
                </span>
              </div>
              <Progress value={passwordStrength} className="h-2" />
              
              {/* Password Requirements */}
              <div className="grid grid-cols-1 gap-1 text-xs">
                {passwordRequirements.map((req, index) => {
                  const passed = req.test(formData.password);
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 ${
                        passed ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {passed ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>{req.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Confirm Password</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">{errors.confirmPassword}</p>
          )}
          {formData.confirmPassword && formData.password && formData.password === formData.confirmPassword && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Passwords match</span>
            </div>
          )}
        </div>
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
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};