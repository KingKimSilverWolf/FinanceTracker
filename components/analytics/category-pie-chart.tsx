'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

// Pastel color palette for modern, light aesthetic
const COLORS = [
  '#93C5FD', // light blue
  '#6EE7B7', // light green
  '#FCD34D', // light amber
  '#FCA5A5', // light red
  '#C4B5FD', // light violet
  '#F9A8D4', // light pink
  '#67E8F9', // light cyan
  '#BEF264', // light lime
];

interface CategoryData {
  name: string;
  value: number; // in cents
  percentage: number;
  [key: string]: unknown;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: CategoryData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-1">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.payload.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string; payload: CategoryData }> }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {payload?.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground truncate">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function CategoryPieChart({
  data,
  title = 'Spending by Category',
  description = 'Your expense distribution',
  isLoading = false,
}: CategoryPieChartProps) {
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
            <p className="text-xs text-muted-foreground">Add expenses to see your spending breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as Array<Record<string, unknown>>}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const entry = props as unknown as CategoryData;
                return `${entry.percentage.toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
