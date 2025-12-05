"use client"

/**
 * Date Range Picker Showcase
 * 
 * This file demonstrates various usage patterns for the DateRangePicker component.
 * Use this as a reference when implementing date filtering in new pages.
 */

import * as React from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from "date-fns"
import { Calendar, RefreshCcw, Download } from "lucide-react"
import type { DateRange } from "react-day-picker"

type PresetType = '1M' | '3M' | '6M' | '1Y' | 'custom'

export function DateRangePickerShowcase() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [preset, setPreset] = React.useState<PresetType>('1M')

  // Calculate stats about selected range
  const stats = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null
    
    const days = differenceInDays(dateRange.to, dateRange.from) + 1
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    
    return { days, weeks, months }
  }, [dateRange])

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Date Range Picker Showcase
        </h1>
        <p className="text-muted-foreground">
          Examples and patterns for using the custom date range picker
        </p>
      </div>

      {/* Example 1: Standalone */}
      <Card>
        <CardHeader>
          <CardTitle>Example 1: Standalone Picker</CardTitle>
          <CardDescription>
            Basic usage with just the date range picker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select a date range"
          />
          
          {dateRange?.from && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="font-medium mb-2">Selected Range:</div>
              <div className="text-sm space-y-1">
                <p>From: {format(dateRange.from, "PPP")}</p>
                {dateRange.to && (
                  <>
                    <p>To: {format(dateRange.to, "PPP")}</p>
                    <p className="pt-2 border-t text-primary font-medium">
                      {stats?.days} days selected
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example 2: With Preset Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Example 2: Preset Tabs + Custom Picker</CardTitle>
          <CardDescription>
            Like Analytics page - quick presets with custom option
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Tabs value={preset} onValueChange={(v) => setPreset(v as PresetType)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="1M">1M</TabsTrigger>
                  <TabsTrigger value="3M">3M</TabsTrigger>
                  <TabsTrigger value="6M">6M</TabsTrigger>
                  <TabsTrigger value="1Y">1Y</TabsTrigger>
                  <TabsTrigger value="custom">
                    <Calendar className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {preset === 'custom' && (
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full md:w-auto"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {preset !== 'custom' && (
              <>
                Showing data from{' '}
                {preset === '1M' && 'last 30 days'}
                {preset === '3M' && 'last 90 days'}
                {preset === '6M' && 'last 180 days'}
                {preset === '1Y' && 'last 365 days'}
              </>
            )}
            {preset === 'custom' && dateRange?.from && dateRange?.to && (
              <>
                Custom range: {stats?.days} days
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Example 3: With Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Example 3: With Action Buttons</CardTitle>
          <CardDescription>
            Date picker with refresh and export actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full md:flex-1 md:max-w-sm"
            />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {stats && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{stats.days} days</Badge>
              <Badge variant="outline">{stats.weeks} weeks</Badge>
              <Badge variant="outline">{stats.months} months</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example 4: Inline with Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Example 4: Inline with Other Filters</CardTitle>
          <CardDescription>
            Like Expenses page - combined with search and type filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Tabs defaultValue="all" className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="shared">👥 Shared</TabsTrigger>
                  <TabsTrigger value="personal">💰 Personal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-3">
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Filter by date"
                className="max-w-sm"
              />
              {dateRange?.from && (
                <p className="text-sm text-muted-foreground">
                  Showing filtered results
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-primary">💡 Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Quick Presets:</strong> 11 built-in presets (Today, Yesterday, Last 7/14/30 days, etc.)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Custom Selection:</strong> Click start date, then end date in calendar
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Clear Button:</strong> X icon appears when dates selected for easy reset
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Auto-Close:</strong> Picker automatically closes when both dates selected
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Responsive:</strong> Dual calendar on desktop, single on mobile
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Accessible:</strong> Full keyboard navigation and screen reader support
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
{`import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

function MyComponent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  return (
    <DateRangePicker
      date={dateRange}
      onDateChange={setDateRange}
      placeholder="Pick a date range"
    />
  )
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
