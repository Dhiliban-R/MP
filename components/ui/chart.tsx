'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface ChartProps {
  data: any[];
  className?: string;
  height?: number;
}

interface AreaChartProps extends ChartProps {
  xField: string;
  yField: string;
  strokeWidth?: number;
  showGrid?: boolean;
  colors?: string[];
}

interface BarChartProps extends ChartProps {
  xField: string;
  yField: string;
  showGrid?: boolean;
  colors?: string[];
}

interface PieChartProps extends ChartProps {
  nameKey: string;
  dataKey: string;
  colors?: string[];
  showLegend?: boolean;
}

interface LineChartProps extends ChartProps {
  xField: string;
  yField: string;
  strokeWidth?: number;
  showGrid?: boolean;
  colors?: string[];
}

export function AreaChart({
  data,
  xField,
  yField,
  strokeWidth = 2,
  showGrid = false,
  colors = ['hsl(var(--primary))'],
  height = 400,
  className
}: AreaChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
}
          <XAxis 
            dataKey={xField} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: 'hsl(var(--card-foreground))'
            }} 
          />
          <Area
            type="monotone"
            dataKey={yField}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            fill={colors[0] + '20'} // Add transparency
            activeDot={{ r: 6 }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({
  data,
  xField,
  yField,
  showGrid = false,
  colors = ['hsl(var(--primary))'],
  height = 400,
  className
}: BarChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />}
          <XAxis 
            dataKey={xField} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: 'hsl(var(--card-foreground))'
            }} 
          />
          <Bar dataKey={yField} fill={colors[0]} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChart({
  data,
  nameKey,
  dataKey,
  colors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent-orange))',
    'hsl(var(--accent-teal))',
    'hsl(var(--accent-rose))'
  ],
  showLegend = true,
  height = 400,
  className
}: PieChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            nameKey={nameKey}
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: 'hsl(var(--card-foreground))'
            }} 
          />
          {showLegend && (
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              fontSize={12}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChart({
  data,
  xField,
  yField,
  strokeWidth = 2,
  showGrid = false,
  colors = ['hsl(var(--primary))'],
  height = 400,
  className
}: LineChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />}
          <XAxis 
            dataKey={xField} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: 'hsl(var(--card-foreground))'
            }} 
          />
          <Line
            type="monotone"
            dataKey={yField}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            dot={{ r: 4, fill: colors[0] }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
