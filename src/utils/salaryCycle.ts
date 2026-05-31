/**
 * Utility for calculating salary credit dates and salary cycles.
 *
 * The app intentionally budgets by salary cycle, never by calendar month.
 */

export type SalaryCreditType = 'fixed' | 'last_working_day';

// Core public/bank holidays for 2026/2027 (standard fixed and major holidays)
const HOLIDAYS: Record<string, string> = {
  // Fixed Annual Holidays (MM-DD)
  '01-01': 'New Year\'s Day',
  '01-26': 'Republic Day',
  '05-01': 'May Day / Labour Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '11-01': 'Karnataka Rajyotsava (Example regional)',
  '12-25': 'Christmas',
  
  // Specific Holiday dates (YYYY-MM-DD) for moving/religious bank holidays in 2026
  '2026-01-14': 'Makar Sankranti',
  '2026-03-06': 'Holi',
  '2026-04-03': 'Good Friday',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali',
};

/**
 * Checks if a date falls on a bank/public holiday.
 */
function toLocalDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(year: number, month: number, offset: number) {
  const shifted = new Date(year, month + offset, 1);
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth(),
  };
}

export function isHoliday(date: Date): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const mmdd = `${month}-${day}`;
  const yyyymmdd = `${date.getFullYear()}-${mmdd}`;
  
  return HOLIDAYS[mmdd] !== undefined || HOLIDAYS[yyyymmdd] !== undefined;
}

/**
 * Checks if a date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Adjusts a date backwards to find the previous working day.
 */
export function getPreviousWorkingDay(date: Date): Date {
  const curr = toLocalDate(date);
  
  while (isWeekend(curr) || isHoliday(curr)) {
    curr.setDate(curr.getDate() - 1);
  }
  return curr;
}

/**
 * Calculates the salary credit date for a given year and month.
 * Month is 0-indexed (0 = Jan, 11 = Dec).
 */
export function getSalaryCreditDateForMonth(
  year: number,
  month: number,
  type: SalaryCreditType,
  fixedDate: number = 1
): Date {
  if (type === 'last_working_day') {
    // Last day of the specified month (month + 1, 0 gets the last day of month)
    const lastDay = new Date(year, month + 1, 0);
    return getPreviousWorkingDay(lastDay);
  } else {
    // Fixed date logic
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualDate = Math.min(fixedDate, lastDayOfMonth);
    const targetDate = new Date(year, month, actualDate);
    
    // Fixed date salaries usually get credited on the previous working day
    // if the date falls on a weekend or bank holiday.
    return getPreviousWorkingDay(targetDate);
  }
}

export interface SalaryCycle {
  id: string; // "YYYY-MM" format representing the start month of this cycle
  name: string; // User friendly description, e.g., "May 2026 Cycle"
  startDate: Date;
  endDate: Date; // Inclusive (day before the next salary credit date)
  nextSalaryDate: Date; // Next cycle's credit date
}

function buildSalaryCycle(
  cycleStartYear: number,
  cycleStartMonth: number,
  type: SalaryCreditType,
  fixedDate: number = 1
): SalaryCycle {
  const startDate = getSalaryCreditDateForMonth(cycleStartYear, cycleStartMonth, type, fixedDate);
  const nextMonth = addMonths(cycleStartYear, cycleStartMonth, 1);
  const nextSalaryDate = getSalaryCreditDateForMonth(nextMonth.year, nextMonth.month, type, fixedDate);

  const endDate = new Date(nextSalaryDate.getTime());
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(23, 59, 59, 999);

  const cycleId = `${cycleStartYear}-${String(cycleStartMonth + 1).padStart(2, '0')}`;
  const name = `${startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })} → ${endDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })}`;

  return {
    id: cycleId,
    name,
    startDate,
    endDate,
    nextSalaryDate,
  };
}

/**
 * Finds the salary cycle details that a given date falls into.
 */
export function getSalaryCycleForDate(
  date: Date,
  type: SalaryCreditType,
  fixedDate: number = 1
): SalaryCycle {
  const d = toLocalDate(date);

  const year = d.getFullYear();
  const month = d.getMonth();

  // 1. Get the credit date of the current month
  const currentMonthCredit = getSalaryCreditDateForMonth(year, month, type, fixedDate);

  let cycleStartYear: number;
  let cycleStartMonth: number;

  if (d.getTime() < currentMonthCredit.getTime()) {
    // Before this month's salary credit, belongs to the previous month's cycle
    cycleStartYear = month === 0 ? year - 1 : year;
    cycleStartMonth = month === 0 ? 11 : month - 1;
  } else {
    // On or after this month's salary credit, belongs to this month's cycle
    cycleStartYear = year;
    cycleStartMonth = month;
  }

  return buildSalaryCycle(cycleStartYear, cycleStartMonth, type, fixedDate);
}

export function getSalaryCycleById(
  cycleId: string,
  type: SalaryCreditType,
  fixedDate: number = 1
): SalaryCycle {
  const [yearPart, monthPart] = cycleId.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return getSalaryCycleForDate(new Date(), type, fixedDate);
  }

  return buildSalaryCycle(year, month, type, fixedDate);
}

export function getCalendarDayDiff(from: Date, to: Date): number {
  const start = toLocalDate(from);
  const end = toLocalDate(to);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a list of salary cycles covering the range of all transactions/current date.
 */
export function getRecentSalaryCycles(
  type: SalaryCreditType,
  fixedDate: number = 1,
  limit: number = 6
): SalaryCycle[] {
  const cycles: SalaryCycle[] = [];
  const today = new Date();
  
  // Start with current date cycle and go backwards
  let currentRef = new Date(today.getTime());
  
  for (let i = 0; i < limit; i++) {
    const cycle = getSalaryCycleForDate(currentRef, type, fixedDate);
    cycles.push(cycle);
    
    // Move reference date to 5 days before the current cycle start to jump to previous cycle
    const prevRef = new Date(cycle.startDate.getTime());
    prevRef.setDate(prevRef.getDate() - 5);
    currentRef = prevRef;
  }
  
  return cycles;
}
