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
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Class Groups & Messaging",
      description: "Stay connected with your classmates through dedicated group chats and discussions",
      color: "bg-education-blue/10 border-education-blue/30 hover:bg-education-blue/20",
      iconBg: "bg-education-blue/20",
      iconColor: "text-education-blue"
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Alumni Network",
      description: "Connect with graduates, get career advice, and maintain lifelong friendships",
      color: "bg-education-orange/10 border-education-orange/30 hover:bg-education-orange/20",
      iconBg: "bg-education-orange/20",
      iconColor: "text-education-orange"
    },
    {
      icon: <School className="w-8 h-8" />,
      title: "School Management",
      description: "Administrators can easily manage students, teachers, and school information",
      color: "bg-education-purple/10 border-education-purple/30 hover:bg-education-purple/20",
      iconBg: "bg-education-purple/20",
      iconColor: "text-education-purple"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Enterprise-grade security with role-based access control and data protection",
      color: "bg-education-green/10 border-education-green/30 hover:bg-education-green/20",
      iconBg: "bg-education-green/20",
      iconColor: "text-education-green"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Role Support",
      description: "Tailored experiences for students, teachers, alumni, and administrators",
      color: "bg-education-pink/10 border-education-pink/30 hover:bg-education-pink/20",
      iconBg: "bg-education-pink/20",
      iconColor: "text-education-pink"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Community Building",
      description: "Foster meaningful relationships and maintain school spirit across generations",
      color: "bg-education-teal/10 border-education-teal/30 hover:bg-education-teal/20",
      iconBg: "bg-education-teal/20",
      iconColor: "text-education-teal"
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

      {/* Hero Carousel Section - Full Height */}
      <HeroCarousel />

      {/* About Section - Full Height */}
      <section id="about" className="min-h-screen flex items-center bg-gradient-to-br from-education-green/10 via-white to-education-teal/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-education-green/5 to-education-teal/5" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium bg-education-green/10 text-education-green border-education-green/20">
              About My School Buddies
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-education-green to-education-teal bg-clip-text text-transparent mb-6">
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
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-education-green to-education-teal rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl transition-shadow">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">100% Verified</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Every school and user profile is verified through official channels, ensuring authenticity and trust.
              </p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-education-blue to-education-purple rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl transition-shadow">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pan-India Reach</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Connecting educational institutions across all states and union territories of India.
              </p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-education-orange to-education-pink rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl transition-shadow">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Connections</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Real-time messaging and networking capabilities for immediate community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Full Height */}
      <section id="features" className="min-h-screen flex items-center bg-gradient-to-br from-education-purple/10 via-white to-education-pink/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-education-purple/5 to-education-pink/5" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium bg-education-purple/10 text-education-purple border-education-purple/20">
              Platform Features
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-education-purple to-education-pink bg-clip-text text-transparent mb-6">
              Everything You Need to Stay Connected
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for Indian educational institutions with features designed 
              to enhance community engagement and academic collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${feature.color} border-2 group`}>
                <CardHeader>
                  <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={feature.iconColor}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700 leading-relaxed text-lg">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section - Compact */}
      <RolesGrid />

      {/* Stats Section - Full Height */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-education-blue via-education-purple to-education-pink relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Trusted by Educational Communities Nationwide
            </h2>
            <p className="text-2xl text-white/90">
              Join the largest verified educational network in India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/30 group-hover:bg-white/30 transition-colors">
                  <div className="text-5xl md:text-6xl font-bold text-white mb-3">
                    {stat.number}
                  </div>
                  <div className="text-xl font-medium text-white/90 mb-2">
                    {stat.label}
                  </div>
                  <div className="text-lg text-white/80">
                    {stat.subtext}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Full Height */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-education-teal/10 via-white to-education-green/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-education-teal/5 to-education-green/5" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium bg-education-teal/10 text-education-teal border-education-teal/20">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-education-teal to-education-green bg-clip-text text-transparent mb-6">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from educators, students, and alumni across India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-2xl transition-all duration-500 border-0 shadow-xl group hover:scale-105">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 italic leading-relaxed text-lg">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-education-teal to-education-green rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-xl">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{testimonial.author}</p>
                      <p className="text-gray-600">{testimonial.role}</p>
                      <p className="text-education-teal font-medium">{testimonial.school}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Full Height */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-education-blue/80 to-education-purple/80 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30" />
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="mb-12">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 mb-8">
              <Award className="w-6 h-6 text-yellow-400" />
              <span className="text-white font-medium text-lg">Trusted by 500+ Schools</span>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Ready to Connect Your School Community?
          </h2>
          <p className="text-2xl text-white/90 mb-12 leading-relaxed max-w-4xl mx-auto">
            Join thousands of educational institutions already building stronger communities 
            through verified connections and meaningful engagement.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/login">
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 px-16 py-6 text-xl font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                Get Started Today
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-3 border-white text-white hover:bg-white hover:text-gray-900 px-16 py-6 text-xl font-bold rounded-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                Register Your School
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 text-lg text-white/80">
            <span>✓ Free to start</span>
            <span className="mx-6">✓ No setup fees</span>
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