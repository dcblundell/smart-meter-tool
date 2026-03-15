import { createStore } from 'solid-js/store';
import type { SmartMeterRow } from './types/SmartMeter';

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

const resetChartState = () => {
  setState('meterData', null);
  setState('headers', []);
  setState('totalGasCost', 0);
  setState('totalElectricityCost', 0);
  setState('isTiered', false);
  setState('weatherData', null);
  setState('dateRange', null);
  setState('baselineElectricityUsageKWh', BASE_ELECTRICITY_USAGE_KWH);
}

export { state, setState, resetChartState };
export type { WeatherData };
