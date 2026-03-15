import { READING_DATE_KEY, TOTAL_TIER_1_KEY } from "../types/SmartMeter";

const validateUtilitiesKingstonData = async (text: string): Promise<boolean> => {
  const firstLine = text.split(/\r?\n/)[0];
  const headers = firstLine.split(',').map((h) => h.trim());
  const hasReadingDate = headers.includes(`"${READING_DATE_KEY}"`);
  const hasTiered = headers.includes(`"${TOTAL_TIER_1_KEY}"`);
  const hasTOU =
    headers.includes('"Total On-Peak kwH Usage"') &&
    headers.includes('"Total Mid-Peak kwH Usage"') &&
    headers.includes('"Total Off-Peak kwH Usage *"');

  return hasReadingDate && (hasTiered || hasTOU);
};

export default validateUtilitiesKingstonData;
