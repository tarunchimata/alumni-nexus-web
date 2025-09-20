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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <motion.div
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <button
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full p-6 rounded-xl border-2 transition-all duration-200 text-left",
                "hover:shadow-lg hover:shadow-black/5",
                isActive 
                  ? "border-primary shadow-lg bg-gradient-to-br shadow-primary/25" 
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              {/* Background Gradient */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200",
                  `bg-gradient-to-br ${tab.gradient}`,
                  isActive && "opacity-5"
                )}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? `bg-gradient-to-br ${tab.gradient} text-white shadow-lg` 
                      : "bg-muted"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {tab.count && (
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.count}
                    </div>
                  )}
                </div>
                
                <h3 className={cn(
                  "font-semibold text-lg mb-2 transition-colors duration-200",
                  isActive ? "text-foreground" : "text-foreground/80"
                )}>
                  {tab.label}
                </h3>
                
                <p className={cn(
                  "text-sm transition-colors duration-200",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                )}>
                  {tab.description}
                </p>
              </div>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 rounded-b-xl",
                    `bg-gradient-to-r ${tab.gradient}`
                  )}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};