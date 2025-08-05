
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Home,
  ArrowLeft,
  Sun,
  Moon
} from "lucide-react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const DashboardHeader = ({ title, showBackButton = false }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { theme } = useRoleTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications] = useState(3);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast.success(`Switched to ${isDarkMode ? 'light' : 'dark'} mode`);
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/activity')) return 'Activity Feed';
    if (path.includes('/people')) return 'People Discovery';
    if (path.includes('/connections')) return 'Connections';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/alumni')) return 'Alumni Directory';
    if (path.includes('/csv-upload')) return 'Data Import';
    if (path.includes('/school-management')) return 'School Management';
    return 'Dashboard';
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${theme.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user.firstName}! 👋
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs p-0 bg-error text-white">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Dashboard Home */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className={`text-white ${theme.badge}`}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${theme.badge}`}
                  >
                    {formatRole(user.role)}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className={`text-white ${theme.badge}`}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <Badge className={`text-xs mt-1 ${theme.badge}`}>
                      {formatRole(user.role)}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center w-full">
                  <User className="w-4 h-4 mr-3" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile/edit" className="flex items-center w-full">
                  <Settings className="w-4 h-4 mr-3" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center w-full">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-error focus:text-error">
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
