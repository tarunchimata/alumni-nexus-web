
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { RegistrationStep1 } from './RegistrationStep1';
import { RegistrationStep2 } from './RegistrationStep2';
import { RegistrationStep3 } from './RegistrationStep3';
import { RegistrationStep4 } from './RegistrationStep4';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  termsAccepted?: boolean;
}

export const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const { toast } = useToast();

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
          setCurrentStep(data.currentStep || 1);
          setSessionInitialized(true);
          console.log('Registration session initialized:', data);
        } else {
          throw new Error('Failed to initialize registration session');
        }
      } catch (error) {
        console.error('Failed to initialize registration:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to start registration. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initRegistration();
  }, [toast]);

  const updateRegistrationData = (stepData: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = async (stepData: Partial<RegistrationData>) => {
    if (!sessionInitialized) {
      toast({
        title: "Session Error",
        description: "Registration session not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      updateRegistrationData(stepData);
      
      // Determine API endpoint based on current step
      let endpoint = '';
      switch (currentStep) {
        case 1:
          endpoint = '/api/registration/basic';
          break;
        case 2:
          endpoint = '/api/registration/school';
          break;
        case 3:
          endpoint = '/api/registration/account';
          break;
        default:
          throw new Error('Invalid step');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stepData),
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentStep(result.currentStep);
        toast({
          title: "Step Completed",
          description: result.message,
        });
      } else {
        // Handle specific field errors
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessage = result.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessage);
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          throw new Error('Step validation failed');
        }
      }
    } catch (error) {
      console.error(`Step ${currentStep} failed:`, error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : 'Please check your information and try again.',
        variant: "destructive",
      });
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
    if (!sessionInitialized) {
      toast({
        title: "Session Error",
        description: "Registration session not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      updateRegistrationData(stepData);
      
      const response = await fetch('/api/registration/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stepData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: result.message,
        });
        
        // Redirect to pending approval page after a short delay
        setTimeout(() => {
          window.location.href = '/auth/pending-approval';
        }, 2000);
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessage = result.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessage);
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration completion failed:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: "destructive",
      });
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

  if (!sessionInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                {steps.map((step) => (
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
