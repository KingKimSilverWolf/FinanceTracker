'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { TopExpense } from '@/lib/firebase/analytics';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface TopExpensesTableProps {
  expenses: TopExpense[];
  isLoading?: boolean;
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export function TopExpensesTable({ expenses, isLoading = false }: TopExpensesTableProps) {
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
          <CardDescription>Your highest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
          <CardDescription>Your highest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No expenses found</p>
            <p className="text-xs text-muted-foreground">Add expenses to see them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'date':
        return direction * (a.date.getTime() - b.date.getTime());
      case 'amount':
        return direction * (a.amount - b.amount);
      case 'category':
        return direction * a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Expenses</CardTitle>
        <CardDescription>Your highest expenses in this period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Group</TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(expense.date, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {expense.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {expense.groupName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Your share info */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing top {expenses.length} expenses sorted by {sortField}
        </div>
      </CardContent>
    </Card>
  );
}
