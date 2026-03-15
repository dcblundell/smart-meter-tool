export enum RateType {
  TOU = 'TOU', // Time of use
  Tiered = 'Tier',
  OLU = 'OLU', // Ultra-Low Overnight
}

export enum TierThreshold {
  TIER_1 = 'Tier 1',
  TIER_2 = 'Tier 2',
}

export const TierRate = {
  [TierThreshold.TIER_1]: 0.12, // 12.0 cents/kWh
  [TierThreshold.TIER_2]: 0.142, // 14.2 cents/kWh
};

// 2025 - https://www.oeb.ca/consumer-information-and-protection/electricity-rates/historical-electricity-rates
// export const TierRate = {
//   [TierThreshold.TIER_1]: 0.093, // 9.3 cents/kWh
//   [TierThreshold.TIER_2]: 0.11, // 11 cents/kWh
// };

export enum TimeOfUse {
  ON_PEAK = 'On-Peak',
  MID_PEAK = 'Mid-Peak',
  OFF_PEAK = 'Off-Peak',
}

export const TOURate = {
  [TimeOfUse.ON_PEAK]: 0.203, // 20.3 cents/kWh
  [TimeOfUse.MID_PEAK]: 0.157, // 15.7 cents/kWh
  [TimeOfUse.OFF_PEAK]: 0.098, // 9.8 cents/kWh
};
