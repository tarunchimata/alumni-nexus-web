
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, User, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import PasswordStrengthMeter from './PasswordStrengthMeter';

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

  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
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
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Create Your Account</h3>
        <p className="text-muted-foreground">
          Set up your username and password to secure your account
        </p>
      </div>

      {/* Username */}
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
          Username can contain letters, numbers, dots, hyphens, and underscores
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <span>Password</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {formData.password && <PasswordStrengthMeter password={formData.password} />}
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <span>Confirm Password</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
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
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <div className="flex items-center space-x-1 text-green-600 text-sm">
            <CheckCircle className="w-3 h-3" />
            <span>Passwords match</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-32">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
