import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const OnboardingBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Check if user has completed onboarding
  const hasCompletedWelcome = localStorage.getItem(`welcome_completed_${user?.id}`);

  if (dismissed || hasCompletedWelcome) {
    return null;
  }

  const handleStartTour = () => {
    navigate('/dashboard/welcome');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Don't mark as completed, just hide the banner for this session
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Welcome to My School Buddies!
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your setup to get the most out of the platform.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleStartTour}>
              Get Started
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingBanner;