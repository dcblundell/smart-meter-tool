import { type TieredSmartMeterRow, type TOUSmartMeterRow, type SmartMeterRow, TOTAL_TIER_1_KEY, TOTAL_TIER_2_KEY } from '../types/SmartMeter';
import { getTierRateForDate, getTOURateForDate } from './getRatesForDate';
import type { Season, DayType } from '../types/Electricity';
import { SUMMER_TIER_THRESHOLD, WINTER_TIER_THRESHOLD } from '../types/Electricity';

/**
 * Determine the season for a given date.
 * Winter: November 1 - April 30
 * Summer: May 1 - October 31
 */
export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  return month >= 5 && month <= 10 ? 'summer' : 'winter';
}

/**
 * Determine if a date is a weekday or weekend.
 * Note: Does not account for holidays
 */
export function getDayType(date: Date): DayType {
  const dayOfWeek = date.getDay();
  // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
}

/**
 * Determine which TOU period an hour of day falls into.
 * Based on Ontario's TOU time brackets.
 * 
 * Hour is expected to be in 12-hour format (1-12 AM/PM)
 */
export function getTOUPeriodForHour(
  hour: number,
  ampm: 'am' | 'pm',
  season: Season,
  dayType: DayType,
): 'on-peak' | 'mid-peak' | 'off-peak' {
  // Convert to 24-hour format
  let hour24 = hour;
  if (ampm === 'pm' && hour !== 12) {
    hour24 = hour + 12;
  } else if (ampm === 'am' && hour === 12) {
    hour24 = 0;
  }

  // Weekend/holiday rates are off-peak all day
  if (dayType === 'weekend') {
    return 'off-peak';
  }

  // Weekday rates vary by season
  if (season === 'summer') {
    // Summer weekday: 7am-11am (mid), 11am-5pm (on), 5pm-7pm (mid), 7pm-7am (off)
    if (hour24 >= 7 && hour24 < 11) return 'mid-peak';
    if (hour24 >= 11 && hour24 < 17) return 'on-peak';
    if (hour24 >= 17 && hour24 < 19) return 'mid-peak';
    return 'off-peak';
  } else {
    // Winter weekday: 7am-11am (on), 11am-5pm (mid), 5pm-7pm (on), 7pm-7am (off)
    if (hour24 >= 7 && hour24 < 11) return 'on-peak';
    if (hour24 >= 11 && hour24 < 17) return 'mid-peak';
    if (hour24 >= 17 && hour24 < 19) return 'on-peak';
    return 'off-peak';
  }
}

/**
 * Calculate alternative pricing for a meter row.
 * If current method is Tiered, calculate TOU cost.
 * If current method is TOU, calculate Tiered cost.
 * 
 * @param cumulativeMonthlyUsage Optional cumulative usage for the month (used for tier allocation when converting TOU to Tiered)
 */
export function calculateAlternativePricingCost(
  row: SmartMeterRow,
  readingDate: Date,
  isTiered: boolean,
  baselineElectricityUsageKWh: number,
  cumulativeMonthlyUsage: number = 0,
): number {
  if (isTiered) {
    // Current is Tiered, calculate TOU alternative
    return calculateTOUCostFromTieredData(row as TieredSmartMeterRow, readingDate, baselineElectricityUsageKWh);
  } else {
    // Current is TOU, calculate Tiered alternative using cumulative tracking
    return calculateTieredCostFromTOUDataWithCumulative(row as TOUSmartMeterRow, readingDate, baselineElectricityUsageKWh, cumulativeMonthlyUsage);
  }
}

/**
 * Extract 24 hours of hourly usage from a TieredSmartMeterRow.
 * Handles the CSV quirk where both column 12 and column 24 are labeled "12 pm KWH Usage".
 * The CSV parser appends "_1" to the duplicate, making it '12 pm KWH Usage_1' (the midnight hour).
 * Also handles values that may have " kWh" suffix appended by the parser.
 */
function extractHourlyUsage(row: TieredSmartMeterRow): number[] {
  const hourly: number[] = [];
  
  // Helper to parse values that might have " kWh" or other units appended
  const parseValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Remove " kWh" suffix or any other non-numeric suffix
      const numStr = val.replace(/\s*kWh.*$/, '').trim();
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };
  
  // Morning hours: 1am-12pm (columns labeled "1 am KWH Usage" through "12 pm KWH Usage")
  const morningLabels = [
    '1 am KWH Usage', '2 am KWH Usage', '3 am KWH Usage', '4 am KWH Usage',
    '5 am KWH Usage', '6 am KWH Usage', '7 am KWH Usage', '8 am KWH Usage',
    '9 am KWH Usage', '10 am KWH Usage', '11 am KWH Usage', '12 pm KWH Usage',
  ];
  
  // Afternoon/evening hours: 1pm-11pm (columns labeled "1 pm KWH Usage" through "11 pm KWH Usage")
  const afternoonLabels = [
    '1 pm KWH Usage', '2 pm KWH Usage', '3 pm KWH Usage', '4 pm KWH Usage',
    '5 pm KWH Usage', '6 pm KWH Usage', '7 pm KWH Usage', '8 pm KWH Usage',
    '9 pm KWH Usage', '10 pm KWH Usage', '11 pm KWH Usage',
  ];
  
  // Extract morning/noon hours (1am-12pm)
  for (const label of morningLabels) {
    const value = parseValue(row[label as keyof TieredSmartMeterRow]);
    hourly.push(value);
  }
  
  // Extract afternoon/evening hours (1pm-11pm)
  for (const label of afternoonLabels) {
    const value = parseValue(row[label as keyof TieredSmartMeterRow]);
    hourly.push(value);
  }
  
  // The midnight hour (12am/00:00) is the duplicate "12 pm KWH Usage" in CSV
  // which the parser renamed to '12 pm KWH Usage_1'
  const midnightValue = parseValue((row as any)['12 pm KWH Usage_1']);
  hourly.push(midnightValue);
  
  return hourly;
}

/**
 * Calculate TOU cost from tiered data using hourly breakdown.
 * Allocates hourly usage to TOU periods based on time of day and season.
 */
function calculateTOUCostFromTieredData(
  row: TieredSmartMeterRow,
  readingDate: Date,
  baselineElectricityUsageKWh: number,
): number {
  const season = getSeason(readingDate);
  const dayType = getDayType(readingDate);
  const rates = getTOURateForDate(readingDate);

  let onPeakUsage = 0;
  let midPeakUsage = 0;
  let offPeakUsage = 0;

  // Extract ALL 24 hours of usage
  const hourlyUsage = extractHourlyUsage(row);
  
  // DEBUG: Log if extraction yields data
  const totalExtracted = hourlyUsage.reduce((a, b) => a + b, 0);
  if (totalExtracted === 0 && parseFloat(row[TOTAL_TIER_1_KEY] as any) > 0) {
    console.warn(`[DEBUG] Hourly extraction returned 0 kWh but CSV shows ${row[TOTAL_TIER_1_KEY]} kWh tier1 + ${row[TOTAL_TIER_2_KEY]} kWh tier2`);
    console.warn(`[DEBUG] Row keys:`, Object.keys(row).slice(0, 30));
  }

  // Process each hour and classify into TOU period
  for (let i = 0; i < hourlyUsage.length; i++) {
    const usage = hourlyUsage[i];
    
    // Convert array index to hour in 12-hour format
    const hour = i < 12 ? i + 1 : i - 11; // hours 1-12 for indices 0-11, then 1-12 for 12-23
    const ampm = i < 12 ? ('am' as const) : ('pm' as const);
    
    const period = getTOUPeriodForHour(hour, ampm, season, dayType);

    if (period === 'on-peak') {
      onPeakUsage += usage;
    } else if (period === 'mid-peak') {
      midPeakUsage += usage;
    } else {
      offPeakUsage += usage;
    }
  }

  // Apply baseline adjustment: distribute proportionally to actual TOU period usage
  const totalUsage = onPeakUsage + midPeakUsage + offPeakUsage;
  
  let onPeakHeating = onPeakUsage;
  let midPeakHeating = midPeakUsage;
  let offPeakHeating = offPeakUsage;

  // Only subtract baseline if we have meaningful usage
  if (totalUsage > 0 && baselineElectricityUsageKWh > 0) {
    const baselineOnPeak = (onPeakUsage / totalUsage) * baselineElectricityUsageKWh;
    const baselineMidPeak = (midPeakUsage / totalUsage) * baselineElectricityUsageKWh;
    const baselineOffPeak = (offPeakUsage / totalUsage) * baselineElectricityUsageKWh;

    onPeakHeating = Math.max(0, onPeakUsage - baselineOnPeak);
    midPeakHeating = Math.max(0, midPeakUsage - baselineMidPeak);
    offPeakHeating = Math.max(0, offPeakUsage - baselineOffPeak);
  }

  const cost = onPeakHeating * rates.onPeak +
    midPeakHeating * rates.midPeak +
    offPeakHeating * rates.offPeak;
  
  // DEBUG
  if (cost === 0 && totalUsage > 0) {
    console.warn(`[DEBUG] TOU calculation returned $0 but totalUsage=${totalUsage}, baseline=${baselineElectricityUsageKWh}, rates=`, rates);
  }

  return cost;
}

/**
 * Calculate Tiered cost from TOU data with awareness of cumulative monthly usage.
 * Parameters:
 * - row: the TOU smart meter row
 * - readingDate: the date of the reading
 * - baselineElectricityUsageKWh: baseline non-heating usage
 * - cumulativeMonthlyUsage: cumulative usage so far in the month
 */
function calculateTieredCostFromTOUDataWithCumulative(
  row: TOUSmartMeterRow,
  readingDate: Date,
  baselineElectricityUsageKWh: number,
  cumulativeMonthlyUsage: number = 0,
): number {
  const rates = getTierRateForDate(readingDate);
  const season = getSeason(readingDate);
  const tierThreshold = season === 'summer' ? SUMMER_TIER_THRESHOLD : WINTER_TIER_THRESHOLD;

  // Get daily usage from TOU data
  const onPeak = row['Total On-Peak kwH Usage'] || 0;
  const midPeak = row['Total Mid-Peak kwH Usage'] || 0;
  const offPeak = row['Total Off-Peak kwH Usage *'] || 0;
  const totalDailyUsage = onPeak + midPeak + offPeak;

  if (totalDailyUsage === 0) return 0;

  // Determine how this day's usage splits between tiers
  let tier1Usage = 0;
  let tier2Usage = 0;

  const remainingTier1Capacity = Math.max(0, tierThreshold - cumulativeMonthlyUsage);

  if (remainingTier1Capacity >= totalDailyUsage) {
    // All usage fits in tier 1
    tier1Usage = totalDailyUsage;
  } else if (remainingTier1Capacity <= 0) {
    // Already past tier 1 threshold, all usage goes to tier 2
    tier2Usage = totalDailyUsage;
  } else {
    // Usage straddles the tier boundary
    tier1Usage = remainingTier1Capacity;
    tier2Usage = totalDailyUsage - remainingTier1Capacity;
  }

  // Apply baseline adjustment
  const split = baselineElectricityUsageKWh / 2;
  const tier1Heating = Math.max(0, tier1Usage - split);
  const tier2Heating = Math.max(0, tier2Usage - split);

  return (
    tier1Heating * rates.tier1 +
    tier2Heating * rates.tier2
  );
}
