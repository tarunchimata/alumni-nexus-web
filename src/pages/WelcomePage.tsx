import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Users, MessageSquare, Calendar, Settings, ArrowRight, Sparkles } from "lucide-react";

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  completed: boolean;
}

const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Check if user has completed onboarding before
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcome_completed_${user?.id}`);
    if (hasSeenWelcome) {
      navigate('/dashboard');
    }
  }, [user?.id, navigate]);

  const getRoleSpecificSteps = (): WelcomeStep[] => {
    const baseSteps: WelcomeStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your photo and personal information to help others connect with you.',
        icon: <Users className="w-6 h-6" />,
        action: {
          label: 'Edit Profile',
          href: '/dashboard/profile/edit'
        },
        completed: completedSteps.includes('profile')
      },
      {
        id: 'explore',
        title: 'Explore the Platform',
        description: 'Discover people, join conversations, and see what\'s happening in your community.',
        icon: <MessageSquare className="w-6 h-6" />,
        action: {
          label: 'Start Exploring',
          href: '/dashboard/people'
        },
        completed: completedSteps.includes('explore')
      }
    ];

    switch (user?.role) {
      case 'platform_admin':
        return [
          ...baseSteps,
          {
            id: 'admin_setup',
            title: 'Platform Administration',
            description: 'Set up system-wide settings and review platform analytics.',
            icon: <Settings className="w-6 h-6" />,
            action: {
              label: 'Admin Dashboard',
              href: '/dashboard/analytics'
            },
            completed: completedSteps.includes('admin_setup')
          }
        ];
      
      case 'school_admin':
        return [
          ...baseSteps,
          {
            id: 'school_setup',
            title: 'School Management',
            description: 'Import users, manage school settings, and review school analytics.',
            icon: <Calendar className="w-6 h-6" />,
            action: {
              label: 'School Dashboard',
              href: '/dashboard/admin/csv-upload'
            },
            completed: completedSteps.includes('school_setup')
          }
        ];
      
      case 'teacher':
        return [
          ...baseSteps,
          {
            id: 'classroom',
            title: 'Connect with Students',
            description: 'Find your students and start building classroom connections.',
            icon: <Users className="w-6 h-6" />,
            action: {
              label: 'Find Students',
              href: '/dashboard/people'
            },
            completed: completedSteps.includes('classroom')
          }
        ];
      
      case 'student':
        return [
          ...baseSteps,
          {
            id: 'classmates',
            title: 'Find Your Classmates',
            description: 'Connect with fellow students and join study groups.',
            icon: <Users className="w-6 h-6" />,
            action: {
              label: 'Find Classmates',
              href: '/dashboard/people'
            },
            completed: completedSteps.includes('classmates')
          }
        ];
      
      case 'alumni':
        return [
          ...baseSteps,
          {
            id: 'network',
            title: 'Rebuild Your Network',
            description: 'Reconnect with old friends and discover alumni in your field.',
            icon: <Users className="w-6 h-6" />,
            action: {
              label: 'Alumni Network',
              href: '/dashboard/people'
            },
            completed: completedSteps.includes('network')
          }
        ];
      
      default:
        return baseSteps;
    }
  };

  const steps = getRoleSpecificSteps();
  const progress = (completedSteps.length / steps.length) * 100;

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleStepAction = (step: WelcomeStep) => {
    markStepCompleted(step.id);
    if (step.action) {
      navigate(step.action.href);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(`welcome_completed_${user?.id}`, 'true');
    navigate('/dashboard');
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      platform_admin: 'Platform Administrator',
      school_admin: 'School Administrator',
      teacher: 'Teacher',
      student: 'Student',
      alumni: 'Alumni'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to My School Buddies!
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Hello {user?.firstName}, let's get you started as a {getRoleDisplayName(user?.role || '')}
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Getting Started</span>
                <span>{completedSteps.length} of {steps.length} completed</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Steps */}
          <div className="grid gap-6 mb-8">
            {steps.map((step, index) => (
              <Card 
                key={step.id} 
                className={`transition-all duration-200 ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : index === currentStep 
                      ? 'ring-2 ring-primary/20 border-primary/20' 
                      : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      step.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {step.completed ? <CheckCircle className="w-6 h-6" /> : step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {step.description}
                      </p>
                    </div>
                    {step.completed && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                {!step.completed && step.action && (
                  <CardContent className="pt-0">
                    <Button 
                      onClick={() => handleStepAction(step)}
                      className="w-full sm:w-auto"
                    >
                      {step.action.label}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Completion */}
          {progress === 100 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Congratulations! You're all set up.
                </h3>
                <p className="text-muted-foreground mb-4">
                  You've completed the initial setup. You can now explore all the features of My School Buddies.
                </p>
                <Button size="lg" onClick={completeOnboarding}>
                  Enter Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Skip Option */}
          {progress < 100 && (
            <div className="text-center">
              <Button variant="ghost" onClick={completeOnboarding}>
                Skip for now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;