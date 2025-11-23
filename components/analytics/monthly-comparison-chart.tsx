'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonData {
  category: string;
  current: number; // in cents
  previous: number; // in cents
  change: number; // percentage
  [key: string]: unknown;
}

interface MonthlyComparisonChartProps {
  data: ComparisonData[];
  currentLabel: string;
  previousLabel: string;
  isLoading?: boolean;
}

const CustomTooltip = ({ 
  active, 
  payload,
}: { 
  active?: boolean; 
  payload?: Array<{ value: number; name: string; dataKey: string; payload?: ComparisonData }>;
}) => {
  if (active && payload && payload.length && payload[0].payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{data.category}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} className="text-sm text-muted-foreground">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
        {data.change !== undefined && (
          <p className={`text-xs mt-1 ${data.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function MonthlyComparisonChart({
  data,
  currentLabel,
  previousLabel,
  isLoading = false,
}: MonthlyComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
          <CardDescription>Compare spending across months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
          <CardDescription>Compare spending across months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">Not enough data</p>
            <p className="text-xs text-muted-foreground">Add expenses across multiple months</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const currentTotal = data.reduce((sum, item) => sum + item.current, 0);
  const previousTotal = data.reduce((sum, item) => sum + item.previous, 0);
  const totalChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal) * 100 
    : 0;

  const getTrendIcon = () => {
    if (Math.abs(totalChange) < 5) return <Minus className="h-4 w-4" />;
    if (totalChange > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Comparison</CardTitle>
        <CardDescription>
          {currentLabel} vs {previousLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total Change</p>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon()}
              <span className={`text-lg font-bold ${
                Math.abs(totalChange) < 5 
                  ? 'text-muted-foreground' 
                  : totalChange > 0 
                    ? 'text-red-500' 
                    : 'text-green-500'
              }`}>
                {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Total</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(currentTotal)}</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data as Array<Record<string, unknown>>}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) => `$${value / 100}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="previous" 
              fill="#94A3B8" 
              name={previousLabel}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="current" 
              fill="#3B82F6" 
              name={currentLabel}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
