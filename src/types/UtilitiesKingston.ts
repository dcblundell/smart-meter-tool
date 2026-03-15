import { READING_DATE_KEY, TOTAL_TIER_1_KEY, TOTAL_TIER_2_KEY } from "./SmartMeter";

export const TIERED_HEADER_MAP: Record<string, string> = {
  [READING_DATE_KEY]: 'Date',
  '12 pm KWH Usage_1': '12 am',
  [TOTAL_TIER_1_KEY]: 'Tier 1',
  [TOTAL_TIER_2_KEY]: 'Tier 2',
};

export const TOU_HEADER_MAP: Record<string, string> = {
  [READING_DATE_KEY]: 'Date',
  'Total On-Peak kwH Usage': 'Total On-Peak',
  'Total Mid-Peak kwH Usage': 'Total Mid-Peak',
  'Total Off-Peak kwH Usage *': 'Total Off-Peak',
};
