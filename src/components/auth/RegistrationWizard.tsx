
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { RegistrationStep1 } from './RegistrationStep1';
import { RegistrationStep2 } from './RegistrationStep2';
import { RegistrationStep3 } from './RegistrationStep3';
import { RegistrationStep4 } from './RegistrationStep4';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import registrationBg from "@/assets/registration-bg.jpg";

interface RegistrationData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  institutionId?: number;
  institutionName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  termsAccepted?: boolean;
}

export const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Personal information' },
    { number: 2, title: 'School Selection', description: 'Choose your institution' },
    { number: 3, title: 'Account Setup', description: 'Username and password' },
    { number: 4, title: 'Confirmation', description: 'Role and terms' },
  ];

  const updateRegistrationData = (stepData: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...stepData }));
  };

  // Client-side step progression — no backend call needed until final submit
  const handleNext = async (stepData: Partial<RegistrationData>) => {
    updateRegistrationData(stepData);
    setCurrentStep(prev => prev + 1);
    setSubmitError(null);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSubmitError(null);
    }
  };

  const handleComplete = async (stepData: Partial<RegistrationData>) => {
    setIsLoading(true);
    setSubmitError(null);

    const finalData = { ...registrationData, ...stepData };
    updateRegistrationData(stepData);

    try {
      const { data: result, error } = await supabase.functions.invoke('register-user', {
        body: {
          firstName: finalData.firstName,
          lastName: finalData.lastName,
          email: finalData.email,
          phone: finalData.phone,
          dateOfBirth: finalData.dateOfBirth,
          institutionId: finalData.institutionId,
          institutionName: finalData.institutionName,
          username: finalData.username,
          password: finalData.password,
          role: finalData.role,
          termsAccepted: finalData.termsAccepted,
        },
      });

      if (error) throw new Error(error.message || 'Registration failed');
      if (result?.error) throw new Error(result.error);

      toast({
        title: "Registration Successful!",
        description: result.message || "Your account has been submitted for approval.",
      });
      setTimeout(() => navigate('/auth/pending-approval'), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      console.error('Registration failed:', error);
      setSubmitError(message);
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <RegistrationStep1 data={registrationData} onNext={handleNext} isLoading={isLoading} />;
      case 2:
        return <RegistrationStep2 data={registrationData} onNext={handleNext} onBack={handleBack} isLoading={isLoading} />;
      case 3:
        return <RegistrationStep3 data={registrationData} onNext={handleNext} onBack={handleBack} isLoading={isLoading} />;
      case 4:
        return <RegistrationStep4 data={registrationData} onComplete={handleComplete} onBack={handleBack} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${registrationBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-white/90 mt-4 text-lg font-medium">Join your school community today</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4">
            <div className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
              </CardDescription>
            </div>

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
            {submitError && currentStep === 4 && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 text-sm text-destructive">{submitError}</div>
                <Button variant="ghost" size="sm" onClick={() => handleComplete(registrationData)} disabled={isLoading}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            )}
            {renderCurrentStep()}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-white/80">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
