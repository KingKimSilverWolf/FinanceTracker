'use client';

import { SpendingInsight } from '@/lib/firebase/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface InsightsPanelProps {
  insights: SpendingInsight[];
  isLoading?: boolean;
  onActionClick?: (insight: SpendingInsight) => void;
}

export function InsightsPanel({ insights, isLoading, onActionClick }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Analyzing your spending patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Smart recommendations based on your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Not enough data to generate insights yet.</p>
            <p className="text-sm mt-2">Add more expenses to see personalized recommendations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: SpendingInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Smart recommendations based on your spending patterns
            </CardDescription>
          </div>
          <Badge variant="outline">{insights.length} insights</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">{getInsightIcon(insight.type)}</div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                  <Badge variant={getPriorityColor(insight.priority)} className="flex-shrink-0">
                    {insight.priority}
                  </Badge>
                </div>

                {insight.category && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    {insight.amount && (
                      <span className="font-medium">
                        ${Math.abs(insight.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {insight.action && onActionClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onActionClick(insight)}
                  >
                    {insight.action}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
