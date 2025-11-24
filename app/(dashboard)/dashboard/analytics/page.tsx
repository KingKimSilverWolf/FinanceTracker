'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  getSpendingSummary,
  getCategoryBreakdown,
  getDailySpending,
  getBudgetStatus,
  getTopExpenses,
  getSpendingInsights,
  getSpendingPredictions,
  detectRecurringExpenses,
  type BudgetStatus as BudgetStatusType,
  type TopExpense,
  type SpendingInsight,
  type SpendingPrediction,
  type RecurringExpense,
} from '@/lib/firebase/analytics';
import { CategoryPieChart } from '@/components/analytics/category-pie-chart';
import { SpendingTrendChart } from '@/components/analytics/spending-trend-chart';
import { AnalyticsSummaryCards } from '@/components/analytics/analytics-summary-cards';
import { BudgetProgressChart } from '@/components/analytics/budget-progress-chart';
import { MonthlyComparisonChart } from '@/components/analytics/monthly-comparison-chart';
import { TopExpensesTable } from '@/components/analytics/top-expenses-table';
import { InsightsPanel } from '@/components/analytics/insights-panel';
import { PredictionsCard } from '@/components/analytics/predictions-card';
import { RecurringExpensesCard } from '@/components/analytics/recurring-expenses-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, format } from 'date-fns';
import { Download, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportAndDownloadExpenses } from '@/lib/export/csv-export';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

type DateRange = '1M' | '3M' | '6M' | '1Y';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Analytics data
  const [summary, setSummary] = useState({
    totalSpent: 0,
    averagePerDay: 0,
    expenseCount: 0,
    topCategory: 'None',
  });
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; percentage: number }>>([]);
  const [trendData, setTrendData] = useState<Array<{ date: string; amount: number }>>([]);
  const [budgetData, setBudgetData] = useState<BudgetStatusType[]>([]);
  const [topExpensesData, setTopExpensesData] = useState<TopExpense[]>([]);
  const [comparisonData, setComparisonData] = useState<Array<{ category: string; current: number; previous: number; change: number }>>([]);
  
  // AI Insights data
  const [insightsData, setInsightsData] = useState<SpendingInsight[]>([]);
  const [predictionsData, setPredictionsData] = useState<SpendingPrediction[]>([]);
  const [recurringData, setRecurringData] = useState<RecurringExpense[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load analytics data
  useEffect(() => {
    if (!user) return;

    const loadAnalytics = async () => {
      try {
        setIsLoading(true);

        // Calculate date range
        const today = new Date();
        const endDate = new Date(today); // Use current date, not end of month
        let startDate: Date;

        switch (dateRange) {
          case '1M':
            startDate = subMonths(today, 1);
            break;
          case '3M':
            startDate = subMonths(today, 3);
            break;
          case '6M':
            startDate = subMonths(today, 6);
            break;
          case '1Y':
            startDate = subMonths(today, 12);
            break;
          default:
            startDate = subMonths(today, 1);
        }

        // Calculate previous period dates for comparison
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const previousEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before startDate
        const previousStart = new Date(previousEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);

        // Fetch all data in parallel
        const groupIds: string[] = []; // TODO: Support filtering by group
        
        const [
          summaryData,
          categoryBreakdown,
          dailySpending,
          budgetStatus,
          topExpenses,
          currentBreakdown,
          previousBreakdown,
          insights,
          predictions,
          recurring,
        ] = await Promise.all([
          getSpendingSummary(user.uid, startDate, endDate),
          getCategoryBreakdown(user.uid, startDate, endDate),
          getDailySpending(user.uid, startDate, endDate),
          getBudgetStatus(user.uid, new Date()),
          getTopExpenses(user.uid, startDate, endDate, 10),
          getCategoryBreakdown(user.uid, startDate, endDate),
          getCategoryBreakdown(user.uid, previousStart, previousEnd),
          getSpendingInsights(user.uid, groupIds, { startDate, endDate }),
          getSpendingPredictions(user.uid, groupIds, 3),
          detectRecurringExpenses(user.uid, groupIds, 6),
        ]);

        // Update state
        setSummary({
          totalSpent: summaryData.totalSpent,
          averagePerDay: summaryData.averagePerDay,
          expenseCount: summaryData.expenseCount,
          topCategory: summaryData.topCategory,
        });

        setCategoryData(
          categoryBreakdown.map((cat) => ({
            name: cat.category,
            value: cat.totalSpent,
            percentage: cat.percentage,
          }))
        );

        setTrendData(dailySpending);
        setBudgetData(budgetStatus);
        setTopExpensesData(topExpenses);
        setInsightsData(insights);
        setPredictionsData(predictions);
        setRecurringData(recurring);
        setInsightsData(insights);
        setPredictionsData(predictions);
        setRecurringData(recurring);

        // Build comparison data
        const comparisonMap = new Map<string, { current: number; previous: number }>();
        currentBreakdown.forEach((cat) => {
          comparisonMap.set(cat.category, { current: cat.totalSpent, previous: 0 });
        });
        previousBreakdown.forEach((cat) => {
          const existing = comparisonMap.get(cat.category) || { current: 0, previous: 0 };
          existing.previous = cat.totalSpent;
          comparisonMap.set(cat.category, existing);
        });

        const comparison = Array.from(comparisonMap.entries())
          .map(([category, data]) => ({
            category,
            current: data.current,
            previous: data.previous,
            change: data.previous > 0 ? ((data.current - data.previous) / data.previous) * 100 : 0,
          }))
          .filter((item) => item.current > 0 || item.previous > 0)
          .sort((a, b) => (b.current + b.previous) - (a.current + a.previous))
          .slice(0, 8);

        setComparisonData(comparison);
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [user, dateRange]);

  const handleRefresh = () => {
    // Trigger reload by updating a key
    setDateRange((prev) => prev);
  };

  const handleExport = async () => {
    if (!user) return;
    
    try {
      setIsExporting(true);
      
      // Calculate date range
      const today = new Date();
      const endDate = new Date(today);
      let startDate: Date;

      switch (dateRange) {
        case '1M':
          startDate = subMonths(today, 1);
          break;
        case '3M':
          startDate = subMonths(today, 3);
          break;
        case '6M':
          startDate = subMonths(today, 6);
          break;
        case '1Y':
          startDate = subMonths(today, 12);
          break;
        default:
          startDate = subMonths(today, 1);
      }

      await exportAndDownloadExpenses({
        userId: user.uid,
        startDate,
        endDate,
      });

      toast.success('Expenses exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export expenses. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">Insights into your spending</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Range Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Select time period</p>
          </div>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">Last Month</SelectItem>
              <SelectItem value="3M">Last 3 Months</SelectItem>
              <SelectItem value="6M">Last 6 Months</SelectItem>
              <SelectItem value="1Y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="mb-6">
          <AnalyticsSummaryCards
            totalSpent={summary.totalSpent}
            averagePerDay={summary.averagePerDay}
            expenseCount={summary.expenseCount}
            topCategory={summary.topCategory}
            isLoading={isLoading}
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2">
            <SpendingTrendChart
              data={trendData}
              isLoading={isLoading}
            />
          </div>
          <div>
            <CategoryPieChart
              data={categoryData}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Budget & Comparison */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <BudgetProgressChart
            budgets={budgetData}
            isLoading={isLoading}
          />
          <MonthlyComparisonChart
            data={comparisonData}
            currentLabel={format(new Date(), 'MMM yyyy')}
            previousLabel={format(subMonths(new Date(), 1), 'MMM yyyy')}
            isLoading={isLoading}
          />
        </div>

        {/* Top Expenses Table */}
        <div className="mb-6">
          <TopExpensesTable
            expenses={topExpensesData}
            isLoading={isLoading}
          />
        </div>

        {/* AI Insights Section */}
        <div className="mb-6">
          <InsightsPanel
            insights={insightsData}
            isLoading={isLoading}
          />
        </div>

        {/* Predictions & Recurring */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <PredictionsCard
            predictions={predictionsData}
            isLoading={isLoading}
          />
          <RecurringExpensesCard
            expenses={recurringData}
            isLoading={isLoading}
          />
        </div>

        {/* Future Features */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              More analytics features in development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• PDF reports with embedded charts</li>
              <li>• Custom date range picker</li>
              <li>• Budget alerts and notifications</li>
              <li>• Expense categorization suggestions</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      </div>
    </DashboardLayout>
  );
}
