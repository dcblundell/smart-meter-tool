export const READING_DATE_KEY = 'Reading Date';
export const TOTAL_TIER_1_KEY = '[touInquiry_download_Total_Tier_1_Consumption]';
export const TOTAL_TIER_2_KEY = '[touInquiry_download_Total_Tier_2_Consumption]';

export interface TieredSmartMeterRow {
  [READING_DATE_KEY]: string;
  '1 am KWH Usage': number;
  '2 am KWH Usage': number;
  '3 am KWH Usage': number;
  '4 am KWH Usage': number;
  '5 am KWH Usage': number;
  '6 am KWH Usage': number;
  '7 am KWH Usage': number;
  '8 am KWH Usage': number;
  '9 am KWH Usage': number;
  '10 am KWH Usage': number;
  '11 am KWH Usage': number;
  '12 pm KWH Usage': number;
  '1 pm KWH Usage': number;
  '2 pm KWH Usage': number;
  '3 pm KWH Usage': number;
  '4 pm KWH Usage': number;
  '5 pm KWH Usage': number;
  '6 pm KWH Usage': number;
  '7 pm KWH Usage': number;
  '8 pm KWH Usage': number;
  '9 pm KWH Usage': number;
  '10 pm KWH Usage': number;
  '11 pm KWH Usage': number;
  '12 pm KWH Usage_1': number;
  [TOTAL_TIER_1_KEY]: number;
  [TOTAL_TIER_2_KEY]: number;
}

export interface TOUSmartMeterRow {
  [READING_DATE_KEY]: string;
  '1 am KWH Usage': number;
  '2 am KWH Usage': number;
  '3 am KWH Usage': number;
  '4 am KWH Usage': number;
  '5 am KWH Usage': number;
  '6 am KWH Usage': number;
  '7 am KWH Usage': number;
  '8 am KWH Usage': number;
  '9 am KWH Usage': number;
  '10 am KWH Usage': number;
  '11 am KWH Usage': number;
  '12 pm KWH Usage': number; // appears twice
  '1 pm KWH Usage': number;
  '2 pm KWH Usage': number;
  '3 pm KWH Usage': number;
  '4 pm KWH Usage': number;
  '5 pm KWH Usage': number;
  '6 pm KWH Usage': number;
  '7 pm KWH Usage': number;
  '8 pm KWH Usage': number;
  '9 pm KWH Usage': number;
  '10 pm KWH Usage': number;
  '11 pm KWH Usage': number;
  'Total On-Peak kwH Usage': number;
  'Total Mid-Peak kwH Usage': number;
  'Total Off-Peak kwH Usage *': number;
}

export type SmartMeterRow = TieredSmartMeterRow | TOUSmartMeterRow;
