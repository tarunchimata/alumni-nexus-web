import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { useRoleTheme } from '@/hooks/useRoleTheme';

interface ModernDashboardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  change?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  icon?: LucideIcon;
  gradient?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline';
  };
  children?: ReactNode;
  className?: string;
}

export const ModernDashboardCard = ({
  title,
  description,
  value,
  change,
  icon: Icon,
  gradient = false,
  actions = [],
  badge,
  children,
  className = ''
}: ModernDashboardCardProps) => {
  const { theme } = useRoleTheme();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-0 ${gradient ? `bg-gradient-to-br ${theme.card}` : 'bg-white'} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className={`text-lg font-semibold ${gradient ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className={gradient ? 'text-white/80' : 'text-gray-600'}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {value && (
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${gradient ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </div>
            {change && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={change.positive ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {change.positive ? '+' : ''}{change.value}%
                </Badge>
                <span className={`text-sm ${gradient ? 'text-white/80' : 'text-gray-600'}`}>
                  {change.label}
                </span>
              </div>
            )}
          </div>
        )}
        
        {children}
        
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className={gradient ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : ''}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};