import { Outlet, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { 
  Menu, 
  Home, 
  Users, 
  MessageCircle, 
  Calendar, 
  Upload, 
  BarChart3, 
  Settings, 
  LogOut,
  ArrowLeft,
  Bell,
  Search,
  Moon,
  Sun,
  School
} from "lucide-react";
import { useState } from "react";

export const ProductionDashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme } = useRoleTheme();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'People', href: '/dashboard/people', icon: Users },
      { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle },
      { name: 'Events', href: '/dashboard/events', icon: Calendar },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    const roleSpecificItems = {
      platform_admin: [
        { name: 'Schools', href: '/dashboard/schools', icon: School },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'CSV Import', href: '/dashboard/admin/csv-upload', icon: Upload },
        { name: 'Matrix Admin', href: '/dashboard/admin/matrix', icon: MessageCircle },
      ],
      school_admin: [
        { name: 'Analytics', href: '/dashboard/school-analytics', icon: BarChart3 },
        { name: 'CSV Import', href: '/dashboard/admin/csv-upload', icon: Upload },
      ],
      teacher: [],
      alumni: [],
      student: []
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[user.role as keyof typeof roleSpecificItems] || [])
    ];
  };

  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {getNavigationItems().map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg` 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/95">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} alt={user.firstName} />
                        <AvatarFallback className={`bg-gradient-to-br ${theme.gradient} text-white`}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <Badge variant="secondary" className="text-xs">
                          {formatRole(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <NavigationItems mobile={true} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Back to Dashboard */}
            {location.pathname !== '/dashboard' && (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}

            {/* Search */}
            <div className="hidden md:flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Search...</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="hidden sm:flex"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{formatRole(user.role)}</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.firstName} />
                <AvatarFallback className={`bg-gradient-to-br ${theme.gradient} text-white text-sm`}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16">
          <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
              <div className="px-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback className={`bg-gradient-to-br ${theme.gradient} text-white`}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {formatRole(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
              <nav className="px-6 space-y-1">
                <NavigationItems />
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};