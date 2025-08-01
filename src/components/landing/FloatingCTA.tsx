import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { School, X } from "lucide-react";
import { Link } from "react-router-dom";

export const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-xs">
        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <School className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="font-bold text-gray-900 mb-2">
            Register Your School
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Join 500+ institutions already on our platform
          </p>
          
          <Link to="/register">
            <Button 
              size="sm" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            >
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Trust Indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Trusted by 10 Lakh+ users</span>
          </div>
        </div>
      </div>
    </div>
  );
};