"use client";

import * as React from "react";
import { format, parse, isValid, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, isToday } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
  disabled,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the string value to Date for display
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const selectedDate = parsed && isValid(parsed) ? parsed : null;

  // Calendar view state
  const [viewMonth, setViewMonth] = React.useState<Date>(
    selectedDate ?? new Date()
  );

  // Sync viewMonth when external value changes
  React.useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const handleDayClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    if (min && formatted < min) return;
    if (max && formatted > max) return;
    onChange(formatted);
    setOpen(false);
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw); // pass raw string, parent can validate
    // Try to parse for calendar view update
    const parsed = parse(raw, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) setViewMonth(parsed);
  };

  const displayValue = selectedDate ? format(selectedDate, "dd MMM yyyy") : "";

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center w-full h-9 px-3 rounded-lg border border-border bg-background/55 text-xs font-semibold",
            "hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate">
            {displayValue || placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="surface-elevated p-0 w-72 rounded-[var(--radius-card)] z-50 overflow-hidden"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <button
            type="button"
            onClick={() => setViewMonth((d) => subMonths(d, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={viewMonth.getMonth()}
              onChange={(e) =>
                setViewMonth((d) => {
                  const nd = new Date(d);
                  nd.setMonth(parseInt(e.target.value));
                  return nd;
                })
              }
              className="text-xs font-black bg-transparent border-none outline-none cursor-pointer text-foreground"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={viewMonth.getFullYear()}
              onChange={(e) =>
                setViewMonth((d) => {
                  const nd = new Date(d);
                  nd.setFullYear(parseInt(e.target.value));
                  return nd;
                })
              }
              className="text-xs font-black bg-transparent border-none outline-none cursor-pointer text-foreground"
            >
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setViewMonth((d) => addMonths(d, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-3 py-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-black text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
          {days.map((day) => {
            const formatted = format(day, "yyyy-MM-dd");
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = isSameMonth(day, viewMonth);
            const isTodayDate = isToday(day);
            const isDisabled =
              (min && formatted < min) ||
              (max && formatted > max);

            return (
              <button
                key={formatted}
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={!!isDisabled}
                className={cn(
                  "h-8 w-full rounded-lg text-xs font-semibold transition-all duration-100 relative",
                  isSelected
                    ? "bg-accent text-accent-foreground shadow-sm font-black"
                    : isTodayDate
                    ? "bg-accent/15 text-accent font-black"
                    : isCurrentMonth
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground/40 hover:bg-muted/40",
                  isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Manual input + Today button */}
        <div className="px-3 pb-3 flex items-center gap-2 border-t border-border/40 pt-3">
          <input
            type="date"
            value={value}
            onChange={handleTextInput}
            className="flex-1 h-7 text-xs bg-muted/50 border border-border/60 rounded-lg px-2 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring/40"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-3 rounded-lg font-bold shrink-0"
            onClick={() => {
              const today = format(new Date(), "yyyy-MM-dd");
              onChange(today);
              setViewMonth(new Date());
              setOpen(false);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
