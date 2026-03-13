import { createStore } from "solid-js/store";
import type { SmartMeterRow } from "./types/SmartMeter";

interface WeatherData {
  daily: {
    time: Date[];
    apparent_temperature_mean: number[];
  };
}

interface AppState {
  meterData: SmartMeterRow[];
  headers: string[];
  totalGasCost: number;
  totalElectricityCost: number;
  isTiered: boolean;
  weatherData: WeatherData | null;
  dateRange: [Date, Date] | null;
}

const [state, setState] = createStore<AppState>({
  meterData: [],
  headers: [],
  totalGasCost: 0,
  totalElectricityCost: 0,
  isTiered: false,
  weatherData: null,
  dateRange: null,
});

export { state, setState };
export type { WeatherData };
