'use client';

import { SpendingPrediction } from '@/lib/firebase/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PredictionsCardProps {
  predictions: SpendingPrediction[];
  isLoading?: boolean;
}

export function PredictionsCard({ predictions, isLoading }: PredictionsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Predictions</CardTitle>
          <CardDescription>Forecasting next month...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Predictions</CardTitle>
          <CardDescription>AI-powered forecast for next month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Not enough historical data for predictions.</p>
            <p className="text-sm mt-2">Add expenses for at least 3 months to see forecasts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: SpendingPrediction['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: SpendingPrediction['trend']) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      case 'stable':
        return 'text-gray-600';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.7) return { label: 'High', variant: 'default' as const };
    if (confidence >= 0.4) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Spending Predictions
            </CardTitle>
            <CardDescription>AI forecast for next month based on trends</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(totalPredicted)}</div>
            <div className="text-xs text-muted-foreground">Predicted Total</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictions.slice(0, 6).map((prediction) => {
            const confidenceBadge = getConfidenceBadge(prediction.confidence);
            
            return (
              <div
                key={prediction.category}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 flex items-center justify-center rounded bg-primary/10">
                    {getTrendIcon(prediction.trend)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{prediction.category}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={getTrendColor(prediction.trend)}>
                        {prediction.trend === 'stable'
                          ? 'Stable'
                          : `${prediction.trend === 'increasing' ? '+' : ''}${prediction.percentageChange.toFixed(0)}%`}
                      </span>
                      <span>•</span>
                      <Badge variant={confidenceBadge.variant} className="text-xs px-1 py-0">
                        {confidenceBadge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(prediction.predictedAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">predicted</div>
                </div>
              </div>
            );
          })}
        </div>

        {predictions.length > 6 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            +{predictions.length - 6} more categories
          </div>
        )}
      </CardContent>
    </Card>
  );
}
