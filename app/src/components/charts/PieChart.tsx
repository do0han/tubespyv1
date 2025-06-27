'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber } from '@/lib/chartUtils';

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  title?: string;
  colors?: string[];
  height?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey = 'name',
  title,
  colors = DEFAULT_COLORS,
  height = 300,
  showTooltip = true,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatValue = formatNumber,
  className = '',
}) => {
  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            값: {formatValue(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            비율: {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // 데이터에 총합 추가 (퍼센티지 계산용)
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  // 커스텀 라벨 함수
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = ((value / total) * 100).toFixed(0);

    // 5% 이상만 라벨 표시
    if (Number(percentage) < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {dataWithTotal.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '20px',
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart; 