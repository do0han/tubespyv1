'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatNumber } from '@/lib/chartUtils';

interface AreaChartProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  xAxisKey = 'date',
  title,
  color = '#3b82f6',
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  fillOpacity = 0.3,
  strokeWidth = 2,
  formatValue = formatNumber,
  className = '',
}) => {
  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          )}
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={formatValue}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={fillOpacity}
            fill={color}
            strokeWidth={strokeWidth}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChart; 