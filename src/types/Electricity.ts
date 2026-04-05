// Rate data interface combining tier and TOU rates
export interface RateData {
  tier1: number;
  tier2: number;
  onPeak: number;
  midPeak: number;
  offPeak: number;
  tierThreshold?: number; // kWh limit for tier 1 (varies by season)
}

export type Season = 'summer' | 'winter';
export type DayType = 'weekday' | 'weekend';

// Tier thresholds for monthly usage (usage at or below threshold = tier 1, above = tier 2)
export const SUMMER_TIER_THRESHOLD = 600; // May 1 - Oct 31
export const WINTER_TIER_THRESHOLD = 1000; // Nov 1 - Apr 30

// Rate schedules Map with effective dates as keys
// https://www.oeb.ca/consumer-information-and-protection/electricity-rates/historical-electricity-rates
export const rateSchedules = new Map<Date, RateData>([
  [
    new Date('2024-11-01'),
    {
      tier1: 0.093, // 9.3 cents/kWh
      tier2: 0.11, // 11 cents/kWh
      onPeak: 0.158, // 15.8 cents/kWh
      midPeak: 0.122, // 12.2 cents/kWh
      offPeak: 0.076, // 7.6 cents/kWh
      tierThreshold: WINTER_TIER_THRESHOLD,
    },
  ],
  [
    new Date('2025-11-01'),
    {
      tier1: 0.12, // 12.0 cents/kWh
      tier2: 0.142, // 14.2 cents/kWh
      onPeak: 0.203, // 20.3 cents/kWh
      midPeak: 0.157, // 15.7 cents/kWh
      offPeak: 0.098, // 9.8 cents/kWh
      tierThreshold: WINTER_TIER_THRESHOLD,
    },
  ],
]);
