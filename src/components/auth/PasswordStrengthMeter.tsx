import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: PasswordCriteria[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const passedCriteria = criteria.filter(criterion => criterion.test(password));
  const strength = (passedCriteria.length / criteria.length) * 100;
  
  const getStrengthColor = () => {
    if (strength < 40) return 'bg-destructive';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          strength < 40 ? 'text-destructive' : 
          strength < 80 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      
      <Progress value={strength} className="h-2">
        <div 
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </Progress>
      
      <div className="space-y-1">
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {passed ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={passed ? 'text-green-600' : 'text-muted-foreground'}>
                {criterion.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;