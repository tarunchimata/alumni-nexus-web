
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Mail, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Your account is pending administrator approval
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Steps */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Account created successfully</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Registration details submitted</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span>Waiting for administrator approval</span>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>What happens next?</span>
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Your registration will be reviewed by school administrators</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• Approval typically takes 1-2 business days</li>
                <li>• Once approved, you can log in and access all features</li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900">Expected Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Registration Submitted</span>
                  <span className="text-blue-600 font-medium">✓ Today</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Under Review</span>
                  <span className="text-blue-600 font-medium">1-2 Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Account Activated</span>
                  <span className="text-blue-600 font-medium">Email Notification</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                You can close this page. We'll email you when your account is ready!
              </p>
              
              <div className="flex space-x-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/login">
                    Try Login
                  </Link>
                </Button>
              </div>
            </div>

            {/* Support */}
            <div className="text-center text-xs text-muted-foreground">
              <p>
                Questions about your registration?{' '}
                <a href="mailto:support@myschoolbuddies.com" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
