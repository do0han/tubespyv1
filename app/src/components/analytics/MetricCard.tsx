'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Users, 
  Video,
  BarChart3
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: 'views' | 'likes' | 'comments' | 'subscribers' | 'videos' | 'engagement';
  className?: string;
}

const iconMap = {
  views: Eye,
  likes: ThumbsUp,
  comments: MessageCircle,
  subscribers: Users,
  videos: Video,
  engagement: BarChart3
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = ''
}) => {
  const IconComponent = icon ? iconMap[icon] : null;

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {IconComponent && (
          <IconComponent className="h-4 w-4 text-gray-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
        )}
        
        {trend && (
          <div className={`flex items-center text-xs ${getTrendColor(trend.type)}`}>
            {getTrendIcon(trend.type)}
            <span className="ml-1">
              {trend.type === 'increase' ? '+' : trend.type === 'decrease' ? '-' : ''}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500 ml-1">지난 주 대비</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 