import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  School, 
  BarChart3, 
  Settings, 
  FileText, 
  Users, 
  MapPin,
  TrendingUp
} from 'lucide-react';

export type SchoolTab = 'overview' | 'analytics' | 'management' | 'reports';

interface SchoolsTabsProps {
  activeTab: SchoolTab;
  onTabChange: (tab: SchoolTab) => void;
}

const tabs = [
  {
    id: 'overview' as SchoolTab,
    label: 'Schools Overview',
    icon: School,
    gradient: 'from-blue-500 to-blue-600',
    description: 'Browse and manage school directory',
    count: null
  },
  {
    id: 'analytics' as SchoolTab,
    label: 'Analytics Dashboard', 
    icon: BarChart3,
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'Insights and data visualization',
    count: null
  },
  {
    id: 'management' as SchoolTab,
    label: 'Management Tools',
    icon: Settings,
    gradient: 'from-purple-500 to-purple-600', 
    description: 'Admin operations and settings',
    count: null
  },
  {
    id: 'reports' as SchoolTab,
    label: 'Reports & Export',
    icon: FileText,
    gradient: 'from-rose-500 to-rose-600',
    description: 'Generate and download reports',
    count: null
  }
];

export const SchoolsTabs: React.FC<SchoolsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <motion.div
            key={tab.id}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <button
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full p-6 rounded-2xl transition-all duration-300 text-left relative overflow-hidden",
                "hover:shadow-2xl transform-gpu",
                isActive 
                  ? "shadow-2xl ring-2 ring-white/20" 
                  : "hover:shadow-xl"
              )}
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${getGradientColors(tab.gradient)})` 
                  : 'hsl(var(--card))',
                borderColor: isActive ? 'transparent' : 'hsl(var(--border))'
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/20 transform translate-x-6 -translate-y-6" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 transform -translate-x-4 translate-y-4" />
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                      : "bg-gradient-to-br " + tab.gradient + " text-white shadow-lg"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {tab.count && (
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.count}
                    </div>
                  )}
                </div>
                
                <h3 className={cn(
                  "font-bold text-xl mb-2 transition-colors duration-200",
                  isActive ? "text-white" : "text-foreground"
                )}>
                  {tab.label}
                </h3>
                
                <p className={cn(
                  "text-sm transition-colors duration-200 leading-relaxed",
                  isActive ? "text-white/90" : "text-muted-foreground"
                )}>
                  {tab.description}
                </p>
              </div>

              {/* Hover Glow Effect */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                  `bg-gradient-to-br ${tab.gradient}`,
                  !isActive && "hover:opacity-20"
                )}
              />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

// Helper function to get gradient colors
const getGradientColors = (gradient: string) => {
  const colorMap: Record<string, string> = {
    'from-blue-500 to-blue-600': '#3b82f6, #2563eb',
    'from-emerald-500 to-emerald-600': '#10b981, #059669', 
    'from-purple-500 to-purple-600': '#8b5cf6, #7c3aed',
    'from-rose-500 to-rose-600': '#f43f5e, #e11d48'
  };
  return colorMap[gradient] || '#3b82f6, #2563eb';
};