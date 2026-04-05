import { rateSchedules, type RateData } from '../types/Electricity';
import { gasRateSchedules, type GasRate } from '../types/Gas';
import type { PricingBlock } from '../types/Gas';

/**
 * Find the appropriate rate data for a given date from the electricity rate schedule.
 * Returns the data for the latest effective date that is <= the given date.
 */
export function getElectricityRateForDate(date: Date): RateData {
  let selectedRate: RateData | undefined;
  let latestEffectiveDate: Date | undefined;

  for (const [effectiveDate, rateData] of rateSchedules) {
    if (effectiveDate <= date) {
      if (!latestEffectiveDate || effectiveDate > latestEffectiveDate) {
        latestEffectiveDate = effectiveDate;
        selectedRate = rateData;
      }
    }
  }

  if (!selectedRate) {
    // Fallback to earliest rate if date is before all schedules
    const [, firstRateData] = Array.from(rateSchedules)[0];
    return firstRateData;
  }

  return selectedRate;
}

/**
 * Get the tier rates applicable for a given date.
 * Returns an object with tier1 and tier2 rates.
 */
export function getTierRateForDate(date: Date): { tier1: number; tier2: number } {
  const rates = getElectricityRateForDate(date);
  return {
    tier1: rates.tier1,
    tier2: rates.tier2,
  };
}

/**
 * Get the TOU rates applicable for a given date.
 * Returns an object with onPeak, midPeak, and offPeak rates.
 */
export function getTOURateForDate(date: Date): {
  onPeak: number;
  midPeak: number;
  offPeak: number;
} {
  const rates = getElectricityRateForDate(date);
  return {
    onPeak: rates.onPeak,
    midPeak: rates.midPeak,
    offPeak: rates.offPeak,
  };
}

/**
 * Get the gas pricing blocks applicable for a given date.
 * Returns the pricing blocks array for the appropriate schedule.
 */
export function getGasRateForDate(date: Date): PricingBlock[] {
  let selectedRate: GasRate | undefined;
  let latestEffectiveDate: Date | undefined;

  for (const [effectiveDate, gasRate] of gasRateSchedules) {
    if (effectiveDate <= date) {
      if (!latestEffectiveDate || effectiveDate > latestEffectiveDate) {
        latestEffectiveDate = effectiveDate;
        selectedRate = gasRate;
      }
    }
  }

  if (!selectedRate) {
    // Fallback to earliest rate if date is before all schedules
    const [, firstGasRate] = Array.from(gasRateSchedules)[0];
    return firstGasRate.pricingBlocks;
  }

  return selectedRate.pricingBlocks;
}
