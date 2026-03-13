import Papa, { type ParseResult } from "papaparse";
import type { SmartMeterRow } from "../types/SmartMeter";
import { TIERED_HEADER_MAP, TOU_HEADER_MAP } from "../types/UtilitiesKingston";
import { setState } from "../store";

const TOTAL_TIER_1_KEY = "[touInquiry_download_Total_Tier_1_Consumption]";
const READING_DATE_KEY = "Reading Date";
const AM_LABEL = "am";
const PM_LABEL = "pm";
const AM_PM_REGEX = /(\d{1,2})\s*(am|pm)/i;
const KWH_UNIT = "kWh";
const KWH_LABEL_BIT = "KWH";

const parseSmartMeterData = (csvFile: string): void => {
  Papa.parse(csvFile, {
    header: true,
    dynamicTyping: true,
    transform: (value: string, column: string) => {
      if (column.includes(KWH_LABEL_BIT)) {
        return formatUnit(value);
      }
      return value;
    },
    complete: (results: ParseResult<SmartMeterRow>) => {
      const isTieredFormat =
        results.meta.fields?.some((field) => field === TOTAL_TIER_1_KEY) ??
        false;

      const formattedHeaders =
        results.meta.fields?.map((header) => {
          if (isTieredFormat && TIERED_HEADER_MAP[header]) {
            return TIERED_HEADER_MAP[header];
          } else {
            if (TOU_HEADER_MAP[header]) {
              return TOU_HEADER_MAP[header];
            }
          }

          // Extract time patterns (e.g., "12 pm", "3 am")
          if (header.includes(PM_LABEL) || header.includes(AM_LABEL)) {
            const timeMatch = header.match(AM_PM_REGEX);
            if (timeMatch) {
              return timeMatch[0];
            }
          }

          return header;
        }) || [];

      const data: SmartMeterRow[] = results.data.filter(
        (row) => row[READING_DATE_KEY],
      );

      setState("isTiered", isTieredFormat);
      setState("meterData", data);
      setState("headers", formattedHeaders);

      if (data.length > 0) {
        const dates = data.map((row) => new Date(row[READING_DATE_KEY]));
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        setState("dateRange", [minDate, maxDate]);
      }
    },
  });
};

const formatUnit = (value: string): string => {
  return `${value} ${KWH_UNIT}`;
};

export default parseSmartMeterData;
