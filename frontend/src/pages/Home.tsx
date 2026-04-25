
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Heart, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

const Home = () => {
  const { isAuthenticated, user, register } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Connect with Alumni",
      description: "Build lasting relationships with graduates and expand your network"
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Academic Support",
      description: "Get help from teachers and seniors for your academic journey"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Resource Sharing",
      description: "Access and share study materials, notes, and learning resources"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Community Events",
      description: "Stay updated with school events and participate in activities"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe Environment",
      description: "School-verified community with secure authentication"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Updates",
      description: "Get instant notifications about important announcements"
    }
  ];

  const testimonials = [
    {
      quote: "This platform helped me connect with my seniors and get valuable career guidance.",
      author: "Priya Singh",
      role: "Student, Class of 2024",
      school: "Delhi Public School"
    },
    {
      quote: "As a teacher, I can now easily share resources and communicate with my students.",
      author: "Dr. Rajesh Kumar",
      role: "Mathematics Teacher",
      school: "St. Xavier's School"
    },
    {
      quote: "The alumni network here is incredible. I found my first job through connections made here.",
      author: "Amit Patel",
      role: "Alumni, Class of 2018",
      school: "Kendriya Vidyalaya"
    }
  ];

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My School Buddies
                </h1>
                <p className="text-lg text-gray-600">Welcome back, {user.firstName}!</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified Account
              </Badge>
              <Badge variant="outline" className="capitalize">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My School Buddies
              </h1>
              <p className="text-xl text-gray-600 mt-2">Connect. Learn. Grow Together.</p>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join your school's vibrant community platform where students, teachers, and alumni 
            connect to share knowledge, support each other, and build lasting relationships.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={register}
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Join Your School
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose My School Buddies?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform is designed specifically for Indian schools to foster meaningful 
            connections and academic growth within your school community.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-lg text-gray-600">
              Real stories from students, teachers, and alumni across India
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-600 italic">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <p className="text-blue-600 font-medium">{testimonial.school}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Connect with Your School Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students, teachers, and alumni who are already part of the platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={register}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Get Started Today
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">My School Buddies</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/support" className="hover:text-white">Support</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-center text-gray-400 text-sm">
            © 2024 My School Buddies. Built for Indian schools with ❤️
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
