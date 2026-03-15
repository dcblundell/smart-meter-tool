import { createStore } from "solid-js/store";
import type { SmartMeterRow } from "./types/SmartMeter";

interface WeatherData {
  daily: {
    time: Date[];
    apparent_temperature_mean: number[];
  };
}

interface AppState {
  meterData: SmartMeterRow[] | null;
  headers: string[];
  totalGasCost: number;
  totalElectricityCost: number;
  isTiered: boolean;
  weatherData: WeatherData | null;
  dateRange: [Date, Date] | null;
  baselineElectricityUsageKWh: number;
}

const BASE_ELECTRICITY_USAGE_KWH = 20; // Baseline electricity usage (kWh) to attribute to non-heating uses per day

const [state, setState] = createStore<AppState>({
  meterData: null,
  headers: [],
  totalGasCost: 0,
  totalElectricityCost: 0,
  isTiered: false,
  weatherData: null,
  dateRange: null,
  baselineElectricityUsageKWh: BASE_ELECTRICITY_USAGE_KWH,
});

export { state, setState };
export type { WeatherData };
