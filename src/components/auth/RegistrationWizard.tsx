import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { RegistrationStep1 } from './RegistrationStep1';
import { RegistrationStep2 } from './RegistrationStep2';
import { RegistrationStep3 } from './RegistrationStep3';
import { RegistrationStep4 } from './RegistrationStep4';
import { Link } from 'react-router-dom';

interface RegistrationData {
  // Step 1
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  
  // Step 2
  institutionId?: number;
  institutionName?: string;
  
  // Step 3
  username?: string;
  password?: string;
  confirmPassword?: string;
  
  // Step 4
  role?: string;
  acceptTerms?: boolean;
}

export const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Personal information' },
    { number: 2, title: 'School Selection', description: 'Choose your institution' },
    { number: 3, title: 'Account Setup', description: 'Username and password' },
    { number: 4, title: 'Confirmation', description: 'Role and terms' },
  ];

  // Initialize registration session
  useEffect(() => {
    const initRegistration = async () => {
      try {
        const response = await fetch('/api/registration/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          setCurrentStep(data.currentStep);
        }
      } catch (error) {
        console.error('Failed to initialize registration:', error);
      }
    };

    initRegistration();
  }, []);

  const updateRegistrationData = (stepData: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = async (stepData: Partial<RegistrationData>) => {
    setIsLoading(true);
    
    try {
      updateRegistrationData(stepData);
      
      // Submit step data to backend
      const response = await fetch(`/api/registration/step${currentStep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stepData),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentStep(result.nextStep);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Step validation failed');
      }
    } catch (error) {
      console.error(`Step ${currentStep} failed:`, error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async (stepData: Partial<RegistrationData>) => {
    setIsLoading(true);
    
    try {
      updateRegistrationData(stepData);
      
      const response = await fetch('/api/registration/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stepData),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to pending approval page
        window.location.href = '/registration/pending';
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration completion failed:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RegistrationStep1
            data={registrationData}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <RegistrationStep2
            data={registrationData}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <RegistrationStep3
            data={registrationData}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <RegistrationStep4
            data={registrationData}
            onComplete={handleComplete}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">MSB</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My School Buddies
            </span>
          </Link>
          <p className="text-muted-foreground mt-2">Join your school community today</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
              </CardDescription>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                {steps.map((step, index) => (
                  <div
                    key={step.number}
                    className={`flex items-center space-x-1 ${
                      step.number < currentStep ? 'text-primary' : 
                      step.number === currentStep ? 'text-foreground font-medium' : 
                      'text-muted-foreground'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="w-4 h-4 text-center text-xs">{step.number}</span>
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};