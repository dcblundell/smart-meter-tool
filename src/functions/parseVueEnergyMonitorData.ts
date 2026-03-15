import Papa, { type ParseResult } from 'papaparse';
import type { VueEnergyMonitorRow } from '../types/VueEnergy';
import { READING_DATE_KEY, TOTAL_TIER_1_KEY, TOTAL_TIER_2_KEY, type SmartMeterRow, type TieredSmartMeterRow } from '../types/SmartMeter';
import { TIERED_HEADER_MAP } from '../types/UtilitiesKingston';

const parseVueEnergyMonitorData = (
  csvFile: string,
  setMeterData: (data: SmartMeterRow[]) => void,
  setHeaders: (headers: string[]) => void,
  setIsTiered: (isTiered: boolean) => void,
): void => {
  Papa.parse(csvFile, {
    header: true,
    dynamicTyping: true,
    transform: (value: string, column: string) => {
      // if (column === "Time Bucket (America/New_York)") {
      //   return formatDate(value);
      // }

      if (column.includes('kWhs')) {
        return value === 'NO CT' ? 0 : Number.parseFloat(value);
      }

      return value;
    },
    complete: (results: ParseResult<VueEnergyMonitorRow>) => {
      // Group data by date
      const groupedByDate = new Map<string, TieredSmartMeterRow>();

      for (const row of results.data) {
        const timestamp = row['Time Bucket (America/New_York)'];
        const heatPumpValue: string = row['Vue Energy Monitor-Heat Pump-Heat Pump (kWhs)'];

        if (!timestamp) continue; // Skip rows without a timestamp

        // Parse timestamp: "01/21/2026 16:00:00"
        const [datePart, timePart] = timestamp.split(' ');
        const hour = Number.parseInt(timePart.split(':')[0], 10);

        // Get or create the daily record
        if (!groupedByDate.has(datePart)) {
          groupedByDate.set(datePart, {
            [READING_DATE_KEY]: datePart,
            '1 am KWH Usage': 0,
            '2 am KWH Usage': 0,
            '3 am KWH Usage': 0,
            '4 am KWH Usage': 0,
            '5 am KWH Usage': 0,
            '6 am KWH Usage': 0,
            '7 am KWH Usage': 0,
            '8 am KWH Usage': 0,
            '9 am KWH Usage': 0,
            '10 am KWH Usage': 0,
            '11 am KWH Usage': 0,
            '12 pm KWH Usage': 0,
            '1 pm KWH Usage': 0,
            '2 pm KWH Usage': 0,
            '3 pm KWH Usage': 0,
            '4 pm KWH Usage': 0,
            '5 pm KWH Usage': 0,
            '6 pm KWH Usage': 0,
            '7 pm KWH Usage': 0,
            '8 pm KWH Usage': 0,
            '9 pm KWH Usage': 0,
            '10 pm KWH Usage': 0,
            '11 pm KWH Usage': 0,
            '12 pm KWH Usage_1': 0,
            [TOTAL_TIER_1_KEY]: 0,
            [TOTAL_TIER_2_KEY]: 0,
          });
        }

        const dailyRecord = groupedByDate.get(datePart)!;
        const hourField = getHourFieldName(hour);

        if (typeof heatPumpValue === 'number') {
          dailyRecord[hourField] = heatPumpValue;
        }
      }

      const transformed = Array.from(groupedByDate.values());

      // Apply TIERED_HEADER_MAP to rename headers only (not data keys)
      const formattedHeaders = Object.keys(transformed[0] || {}).map((key) => {
        // First check TIERED_HEADER_MAP
        if (TIERED_HEADER_MAP[key]) {
          return TIERED_HEADER_MAP[key];
        }

        // Extract time patterns (e.g., "1 am", "12 pm")
        if (key.includes('pm') || key.includes('am')) {
          const timeMatch = key.match(/\d{1,2}\s*(am|pm)/i);
          if (timeMatch) {
            return timeMatch[0];
          }
        }

        return key;
      });

      console.log('transformed', transformed);

      setIsTiered(true);
      setMeterData(transformed);
      setHeaders(formattedHeaders);
    },
  });
};

const getHourFieldName = (hour: number): keyof TieredSmartMeterRow => {
  // Convert 24-hour format to field names like "1 am KWH Usage", "12 pm KWH Usage"
  if (hour === 0) return '12 pm KWH Usage_1'; // midnight (12 am)
  if (hour === 12) return '12 pm KWH Usage'; // noon
  if (hour < 12) return `${hour} am KWH Usage` as keyof TieredSmartMeterRow;
  return `${hour - 12} pm KWH Usage` as keyof TieredSmartMeterRow;
};

export default parseVueEnergyMonitorData;
