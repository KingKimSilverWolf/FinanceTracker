"use client"

import * as React from "react"
import { DateRangePicker } from "./date-range-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

/**
 * Demo component showcasing the DateRangePicker features
 * 
 * Features demonstrated:
 * - Quick preset selections (Today, Last 7 days, Last 30 days, etc.)
 * - Custom date range selection with dual calendar view
 * - Clear button to reset selection
 * - Auto-close on complete selection
 * - Responsive design (mobile & desktop friendly)
 * - Beautiful teal-themed design matching DuoFi brand
 */
export function DateRangePickerDemo() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Custom Date Range Picker</CardTitle>
        <CardDescription>
          Select a date range using quick presets or custom selection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Date Range
          </label>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Pick a date range"
          />
        </div>

        {/* Display Selected Range */}
        {dateRange?.from && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold text-sm mb-2">Selected Range:</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">From:</span>{" "}
                <span className="font-medium">
                  {format(dateRange.from, "PPP")}
                </span>
              </p>
              {dateRange.to && (
                <>
                  <p>
                    <span className="text-muted-foreground">To:</span>{" "}
                    <span className="font-medium">
                      {format(dateRange.to, "PPP")}
                    </span>
                  </p>
                  <p className="pt-2 border-t mt-2">
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    <span className="font-medium">
                      {Math.ceil(
                        (dateRange.to.getTime() - dateRange.from.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}{" "}
                      days
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Quick presets (Today, Yesterday, Last 7/14/30 days)</li>
            <li>Monthly presets (This month, Last month, Last 3/6 months)</li>
            <li>Yearly presets (This year, Last year)</li>
            <li>Custom date selection with dual calendar view</li>
            <li>Clear button to reset selection</li>
            <li>Auto-close on complete selection</li>
            <li>Fully responsive design</li>
            <li>Accessible with keyboard navigation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
