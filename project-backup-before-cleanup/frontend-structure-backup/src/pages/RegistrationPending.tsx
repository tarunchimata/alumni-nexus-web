import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RegistrationPending = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Registration Submitted</CardTitle>
              <CardDescription className="mt-2">
                Your account is pending approval from your institution's administrator
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Registration Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Your account has been created successfully
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    We've notified your school administrator about your registration
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <Clock className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Approval Pending</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email once your account is approved
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Your school admin will review your registration</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• You can then log in and access your school community</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Need help? Contact your school administrator or our support team.
              </p>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPending;