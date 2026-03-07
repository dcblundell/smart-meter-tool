import Papa, { type ParseResult } from "papaparse";
import type { SmartMeterRow } from "../types/SmartMeter";
import { TIERED_HEADER_MAP, TOU_HEADER_MAP } from "../types/UtilitiesKingston";

const parseSmartMeterData = (
  csvFile: string,
  setMeterData: (data: SmartMeterRow[]) => void,
  setHeaders: (headers: string[]) => void,
  setIsTiered: (isTiered: boolean) => void,
  isTiered: () => boolean,
): void => {
  Papa.parse(csvFile, {
    header: true,
    dynamicTyping: true,
    transform: (value: string, column: string) => {
      if (column.includes("KWH")) {
        return formatUnit(value);
      }
      return value;
    },
    complete: (results: ParseResult<SmartMeterRow>) => {
      const isTieredFormat =
        results.meta.fields?.some((field) =>
          field.includes("touInquiry_download_Total_Tier_1_Consumption"),
        ) ?? false;

      setIsTiered(isTieredFormat);

      const formattedHeaders =
        results.meta.fields?.map((header) => {
          if (isTiered() && TIERED_HEADER_MAP[header]) {
            return TIERED_HEADER_MAP[header];
          } else {
            if (TOU_HEADER_MAP[header]) {
              return TOU_HEADER_MAP[header];
            }
          }

          // Extract time patterns (e.g., "12 pm", "3 am")
          if (header.includes("pm") || header.includes("am")) {
            const timeMatch = header.match(/\d{1,2}\s*(am|pm)/i);
            if (timeMatch) {
              return timeMatch[0];
            }
          }

          return header;
        }) || [];

      const data: SmartMeterRow[] = results.data.filter(
        (row) => row["Reading Date"],
      );

      setMeterData(data);
      setHeaders(formattedHeaders);
    },
  });
};

const formatUnit = (value: string): string => {
  return `${value} kWh`;
};

export default parseSmartMeterData;
