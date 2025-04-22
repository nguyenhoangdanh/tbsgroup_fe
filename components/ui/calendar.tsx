"use client"

import { useState, useEffect } from "react"
import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type CaptionProps } from "react-day-picker"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Custom caption component for month and year selection
function CustomCaption({ displayMonth, displayIndex }: CaptionProps) {
  const [month, setMonth] = useState(displayMonth)
  const [monthChangeCallback, setMonthChangeCallback] = useState<((date: Date) => void) | null>(null)

  // Find the DayPicker's onMonthChange callback
  useEffect(() => {
    // Update our local state when displayMonth changes from parent
    setMonth(displayMonth)
  }, [displayMonth])

  const currentYear = new Date().getFullYear()

  // Get all month names
  const months = Array.from({ length: 12 }).map((_, i) => {
    return {
      value: i.toString(),
      label: format(new Date(0, i), "MMMM", { locale: vi }),
    }
  })

  // Generate years (10 years before and after current year)
  const years = Array.from({ length: 21 }).map((_, i) => {
    const year = currentYear - 10 + i
    return {
      value: year.toString(),
      label: year.toString(),
    }
  })

  // This function will be called when we want to change the month
  const handleMonthChange = (newMonth: Date) => {
    // Find the closest DayPicker component and trigger a month change
    const dayPicker = document.querySelector(".rdp") as HTMLElement
    if (!dayPicker) return

    // Use a custom event to communicate with our Calendar wrapper
    const event = new CustomEvent("monthChange", {
      detail: { month: newMonth },
      bubbles: true,
    })
    dayPicker.dispatchEvent(event)
  }

  return (
    <div className="flex items-center justify-center gap-2 px-1">
      <Select
        value={month.getMonth().toString()}
        onValueChange={(value) => {
          const newDate = new Date(month)
          newDate.setMonth(Number.parseInt(value))
          handleMonthChange(newDate)
        }}
      >
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={month.getFullYear().toString()}
        onValueChange={(value) => {
          const newDate = new Date(month)
          newDate.setFullYear(Number.parseInt(value))
          handleMonthChange(newDate)
        }}
      >
        <SelectTrigger className="h-8 w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year.value} value={year.value}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [month, setMonth] = useState<Date | undefined>(props.defaultMonth || new Date())

  // Listen for custom monthChange events from our Caption component
  useEffect(() => {
    const handleMonthChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && customEvent.detail.month) {
        setMonth(customEvent.detail.month)
        props.onMonthChange?.(customEvent.detail.month)
      }
    }

    document.addEventListener("monthChange", handleMonthChange as EventListener)
    return () => {
      document.removeEventListener("monthChange", handleMonthChange as EventListener)
    }
  }, [props.onMonthChange])

  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Hide default caption label when using custom caption
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => <ChevronLeft className={cn("h-4 w-4", className)} {...props} />,
        IconRight: ({ className, ...props }) => <ChevronRight className={cn("h-4 w-4", className)} {...props} />,
        Caption: CustomCaption,
      }}
      locale={vi}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }



















// "use client"

// import * as React from "react"
// import { ChevronLeft, ChevronRight } from "lucide-react"
// import { DayPicker } from "react-day-picker"

// import { cn } from "@/lib/utils"
// import { buttonVariants } from "@/components/ui/button"

// export type CalendarProps = React.ComponentProps<typeof DayPicker>

// function Calendar({
//   className,
//   classNames,
//   showOutsideDays = true,
//   ...props
// }: CalendarProps) {
//   return (
//     <DayPicker
//       showOutsideDays={showOutsideDays}
//       className={cn("p-3", className)}
//       classNames={{
//         months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
//         month: "space-y-4",
//         caption: "flex justify-center pt-1 relative items-center",
//         caption_label: "text-sm font-medium",
//         nav: "space-x-1 flex items-center",
//         nav_button: cn(
//           buttonVariants({ variant: "outline" }),
//           "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
//         ),
//         nav_button_previous: "absolute left-1",
//         nav_button_next: "absolute right-1",
//         table: "w-full border-collapse space-y-1",
//         head_row: "flex",
//         head_cell:
//           "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
//         row: "flex w-full mt-2",
//         cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
//         day: cn(
//           buttonVariants({ variant: "ghost" }),
//           "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
//         ),
//         day_range_end: "day-range-end",
//         day_selected:
//           "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
//         day_today: "bg-accent text-accent-foreground",
//         day_outside:
//           "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
//         day_disabled: "text-muted-foreground opacity-50",
//         day_range_middle:
//           "aria-selected:bg-accent aria-selected:text-accent-foreground",
//         day_hidden: "invisible",
//         ...classNames,
//       }}
//       components={{
//         IconLeft: ({ className, ...props }) => (
//           <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
//         ),
//         IconRight: ({ className, ...props }) => (
//           <ChevronRight className={cn("h-4 w-4", className)} {...props} />
//         ),
//       }}
//       {...props}
//     />
//   )
// }
// Calendar.displayName = "Calendar"

// export { Calendar }
