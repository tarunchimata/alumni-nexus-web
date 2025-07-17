import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Activity,
  Users,
  UserPlus,
  Calendar,
  Settings,
  Shield,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    const baseItems = [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
      { href: "/dashboard/activity", icon: Activity, label: "Activity Feed" },
      { href: "/dashboard/people", icon: Users, label: "People Discovery" },
      { href: "/dashboard/connections", icon: UserPlus, label: "Connections" },
      { href: "/dashboard/events", icon: Calendar, label: "Events" },
    ];

    // Add role-specific items
    const roleItems = [];
    
    if (user?.role === 'platform_admin') {
      roleItems.push(
        { href: "/dashboard/admin", icon: Shield, label: "Admin Panel" }
      );
    }
    
    if (user?.role === 'school_admin') {
      roleItems.push(
        { href: "/dashboard/school", icon: GraduationCap, label: "School Management" }
      );
    }
    
    if (user?.role === 'teacher') {
      roleItems.push(
        { href: "/dashboard/classes", icon: BookOpen, label: "My Classes" }
      );
    }

    return [...baseItems, ...roleItems, 
      { href: "/dashboard/settings", icon: Settings, label: "Settings" }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="mb-2"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5", collapsed ? "" : "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};