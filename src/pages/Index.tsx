
import { Navigation } from "@/components/landing/Navigation";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { RolesGrid } from "@/components/landing/RolesGrid";
import { FloatingCTA } from "@/components/landing/FloatingCTA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  GraduationCap, 
  School, 
  Shield, 
  Users, 
  Heart,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  Globe,
  Zap,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Class Groups & Messaging",
      description: "Stay connected with your classmates through dedicated group chats and discussions",
      color: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Alumni Network",
      description: "Connect with graduates, get career advice, and maintain lifelong friendships",
      color: "bg-orange-50 border-orange-200",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      icon: <School className="w-6 h-6" />,
      title: "School Management",
      description: "Administrators can easily manage students, teachers, and school information",
      color: "bg-purple-50 border-purple-200",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Enterprise-grade security with role-based access control and data protection",
      color: "bg-green-50 border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-Role Support",
      description: "Tailored experiences for students, teachers, alumni, and administrators",
      color: "bg-pink-50 border-pink-200",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Community Building",
      description: "Foster meaningful relationships and maintain school spirit across generations",
      color: "bg-indigo-50 border-indigo-200",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600"
    }
  ];

  const stats = [
    { number: "10 Lakh+", label: "Verified Institutions", subtext: "onboarded nationwide" },
    { number: "10,000+", label: "Alumni Members", subtext: "connecting daily" },
    { number: "500+", label: "Schools Connected", subtext: "across India" },
    { number: "1M+", label: "Messages Sent", subtext: "fostering connections" }
  ];

  const testimonials = [
    {
      quote: "My School Buddies has transformed how our alumni stay connected. The platform is intuitive and the security features give us confidence.",
      author: "Dr. Priya Sharma",
      role: "Principal",
      school: "Delhi Public School, Mumbai",
      rating: 5
    },
    {
      quote: "I found my current job through connections I made on this platform. The alumni network here is incredible and supportive.",
      author: "Rohit Patel",
      role: "Software Engineer, Alumni Class of 2018",
      school: "Kendriya Vidyalaya",
      rating: 5
    },
    {
      quote: "As a teacher, I love how easy it is to share resources and communicate with both current and former students.",
      author: "Mrs. Anjali Gupta",
      role: "Mathematics Teacher",
      school: "St. Xavier's School, Bangalore",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Carousel Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HeroCarousel />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              About My School Buddies
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Bridging Educational Communities Across India
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              My School Buddies is India's premier educational networking platform designed specifically 
              for schools, institutions, and their communities. We connect students, teachers, alumni, 
              and administrators in a secure, verified environment that fosters meaningful relationships 
              and educational growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Verified</h3>
              <p className="text-gray-600">
                Every school and user profile is verified through official channels, ensuring authenticity and trust.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pan-India Reach</h3>
              <p className="text-gray-600">
                Connecting educational institutions across all states and union territories of India.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Connections</h3>
              <p className="text-gray-600">
                Real-time messaging and networking capabilities for immediate community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Everything You Need to Stay Connected
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for Indian educational institutions with features designed 
              to enhance community engagement and academic collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${feature.color} border-2`}>
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    <div className={feature.iconColor}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Grid */}
      <RolesGrid />

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Educational Communities Nationwide
            </h2>
            <p className="text-xl text-blue-100">
              Join the largest verified educational network in India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-lg font-medium text-blue-100 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-blue-200">
                    {stat.subtext}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from educators, students, and alumni across India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 italic leading-relaxed text-base">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-primary font-medium">{testimonial.school}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Trusted by 500+ Schools</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Connect Your School Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of educational institutions already building stronger communities 
            through verified connections and meaningful engagement.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 px-12 py-4 text-lg font-semibold"
              >
                Get Started Today
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-12 py-4 text-lg font-semibold"
              >
                Register Your School
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-blue-200">
            <span>✓ Free to start</span>
            <span className="mx-4">✓ No setup fees</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">My School Buddies</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                India's premier educational networking platform connecting schools, students, 
                teachers, and alumni in verified, secure communities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    f
                  </div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    in
                  </div>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Platform</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#roles" className="hover:text-white transition-colors">User Roles</a></li>
                <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; 2024 My School Buddies. Built for Indian education with ❤️
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <FloatingCTA />
    </div>
  );
};

export default Index;
