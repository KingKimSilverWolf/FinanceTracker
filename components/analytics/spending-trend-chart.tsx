'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface TrendDataPoint {
  date: string; // ISO date string "2024-11-23"
  amount: number; // in cents
  [key: string]: unknown;
}

interface SpendingTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label ? format(parseISO(label), 'MMM d, yyyy') : ''}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} className="text-sm text-muted-foreground">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingTrendChart({
  data,
  title = 'Spending Trend',
  description = 'Your spending over time',
  isLoading = false,
}: SpendingTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">No expense data available</p>
            <p className="text-xs text-muted-foreground">Add expenses to see your spending trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for display
  const chartData = data.map((point) => ({
    ...point,
    displayDate: format(parseISO(point.date), 'MMM d'),
    displayAmount: point.amount / 100, // Convert to dollars for better axis labels
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData as Array<Record<string, unknown>>}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Spending"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
