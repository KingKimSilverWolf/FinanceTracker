"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setInternalDate(date)
  }, [date])

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setInternalDate(selectedDate)
    onDateChange?.(selectedDate)
    
    // Auto-close when both dates are selected
    if (selectedDate?.from && selectedDate?.to) {
      setTimeout(() => setIsOpen(false), 300)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalDate(undefined)
    onDateChange?.(undefined)
  }

  const handlePreset = (preset: string) => {
    const today = new Date()
    let newRange: DateRange | undefined

    switch (preset) {
      case "today":
        newRange = { from: today, to: today }
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        newRange = { from: yesterday, to: yesterday }
        break
      case "last7":
        newRange = { from: subDays(today, 6), to: today }
        break
      case "last14":
        newRange = { from: subDays(today, 13), to: today }
        break
      case "last30":
        newRange = { from: subDays(today, 29), to: today }
        break
      case "thisMonth":
        newRange = { from: startOfMonth(today), to: today }
        break
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
        break
      case "last3Months":
        newRange = { from: subMonths(today, 3), to: today }
        break
      case "last6Months":
        newRange = { from: subMonths(today, 6), to: today }
        break
      case "thisYear":
        newRange = { from: startOfYear(today), to: today }
        break
      case "lastYear":
        const lastYear = subYears(today, 1)
        newRange = { from: startOfYear(lastYear), to: endOfYear(lastYear) }
        break
      default:
        newRange = undefined
    }

    setInternalDate(newRange)
    onDateChange?.(newRange)
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !internalDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "LLL dd, y")} -{" "}
                  {format(internalDate.to, "LLL dd, y")}
                </>
              ) : (
                format(internalDate.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
            {internalDate?.from && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Presets */}
            <div className="flex flex-col gap-1 border-r p-3 pr-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Quick Select
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("today")}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("yesterday")}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("last7")}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("last14")}
              >
                Last 14 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("last30")}
              >
                Last 30 days
              </Button>
              <div className="my-1 border-t"></div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("thisMonth")}
              >
                This month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("lastMonth")}
              >
                Last month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("last3Months")}
              >
                Last 3 months
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("last6Months")}
              >
                Last 6 months
              </Button>
              <div className="my-1 border-t"></div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("thisYear")}
              >
                This year
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 px-2"
                onClick={() => handlePreset("lastYear")}
              >
                Last year
              </Button>
            </div>
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={internalDate?.from}
                selected={internalDate}
                onSelect={handleSelect}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
