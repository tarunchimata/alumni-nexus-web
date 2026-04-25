import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  School, 
  GraduationCap, 
  Users, 
  Heart,
  CheckCircle,
  Settings,
  BookOpen,
  MessageSquare,
  Award
} from "lucide-react";

const roles = [
  {
    id: "platform-admin",
    title: "Platform Administrator",
    subtitle: "System-wide management",
    icon: <Shield className="w-8 h-8" />,
    color: "from-red-500 to-pink-600",
    bgColor: "bg-red-50 border-red-200",
    description: "Complete control over the entire platform ecosystem",
    capabilities: [
      "Manage all schools and institutions",
      "Oversee platform security and compliance",
      "Access comprehensive analytics",
      "Configure system-wide settings"
    ],
    badge: "Super Admin"
  },
  {
    id: "school-admin",
    title: "School Administrator",
    subtitle: "Institution management",
    icon: <School className="w-8 h-8" />,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Full administrative control over your school's community",
    capabilities: [
      "Manage teachers and staff accounts",
      "Oversee student registrations",
      "Control school-specific settings",
      "Access detailed school analytics"
    ],
    badge: "Admin"
  },
  {
    id: "teacher",
    title: "Teacher",
    subtitle: "Educational leadership",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50 border-green-200",
    description: "Connect with students and manage class communities",
    capabilities: [
      "Create and manage class groups",
      "Share educational resources",
      "Communicate with students and parents",
      "Track student engagement"
    ],
    badge: "Educator"
  },
  {
    id: "student",
    title: "Student",
    subtitle: "Learning community",
    icon: <BookOpen className="w-8 h-8" />,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50 border-purple-200",
    description: "Access your school community and educational resources",
    capabilities: [
      "Join class groups and discussions",
      "Connect with classmates and teachers",
      "Access shared study materials",
      "Participate in school activities"
    ],
    badge: "Learner"
  },
  {
    id: "alumni",
    title: "Alumni",
    subtitle: "Lifelong connections",
    icon: <Heart className="w-8 h-8" />,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50 border-orange-200",
    description: "Reconnect with your school and mentor current students",
    capabilities: [
      "Network with fellow graduates",
      "Mentor current students",
      "Share career opportunities",
      "Stay updated with school news"
    ],
    badge: "Graduate"
  }
];

export const RolesGrid = () => {
  return (
    <section id="roles" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Every Member of Your School Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each role has tailored features and permissions designed to enhance their specific needs 
            and responsibilities within the educational ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roles.filter(role => role.id !== 'platform-admin').map((role, index) => (
            <Card 
              key={role.id} 
              className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${role.bgColor} border-2`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    {role.icon}
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    {role.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-gray-900 mb-2">
                  {role.title}
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  {role.subtitle}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {role.description}
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Key Capabilities
                  </h4>
                  <ul className="space-y-2">
                    {role.capabilities.map((capability, capIndex) => (
                      <li key={capIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Settings className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold text-gray-900">
                Seamless Role Management
              </h3>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Our intelligent role-based system automatically adjusts features and permissions 
              based on user verification and school policies.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure Access</h4>
                <p className="text-sm text-gray-600">Multi-layer authentication and verification</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy Onboarding</h4>
                <p className="text-sm text-gray-600">Simple registration with instant role assignment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Matching</h4>
                <p className="text-sm text-gray-600">AI-powered connections and recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};