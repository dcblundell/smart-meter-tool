import type { WeatherData } from '../store';

/**
 * Calculate Heating Degree Days (HDD) for a period.
 * HDD measures the cumulative deficit of temperature below a baseline.
 * Used to normalize heating energy consumption across different time periods.
 * 
 * @param temperatures Array of daily mean temperatures in Celsius
 * @param baselineTemp Baseline temperature (typically 18°C/65°F for heating)
 * @returns Total HDD for the period
 */
export function calculateHDD(temperatures: number[], baselineTemp: number = 18): number {
  return temperatures.reduce((sum, temp) => {
    return sum + Math.max(0, baselineTemp - temp);
  }, 0);
}

/**
 * Normalize consumption based on temperature differences.
 * Adjusts actual consumption to what it would have been at a standard temperature.
 * 
 * @param actualConsumption Actual measured consumption (kWh)
 * @param actualHDD Heating degree days for the actual period
 * @param baselineHDD Heating degree days for the baseline/comparison period
 * @returns Normalized consumption adjusted to baseline temperature conditions
 */
export function normalizeConsumption(
  actualConsumption: number,
  actualHDD: number,
  baselineHDD: number,
): number {
  if (actualHDD === 0) return actualConsumption;
  return actualConsumption * (baselineHDD / actualHDD);
}

/**
 * Calculate HDD from weather data
 */
export function calculateHDDFromWeather(
  weatherData: WeatherData | null,
  dateRange: [Date, Date] | null,
  baselineTemp: number = 18,
): number {
  if (!weatherData || !dateRange) return 0;

  const [startDate, endDate] = dateRange;
  let hdd = 0;

  for (let i = 0; i < weatherData.daily.time.length; i++) {
    const date = weatherData.daily.time[i];
    if (date >= startDate && date <= endDate) {
      const temp = weatherData.daily.apparent_temperature_mean[i];
      hdd += Math.max(0, baselineTemp - temp);
    }
  }

  return hdd;
}

/**
 * Analyze efficiency improvement between two periods
 * accounting for temperature differences
 */
export function analyzeEfficiencyImprovement(
  baseline: {
    consumption: number;
    hdd: number;
    cost: number;
  },
  current: {
    consumption: number;
    hdd: number;
    cost: number;
  },
): {
  actualConsumptionChange: number; // negative = improvement
  actualConsumptionChangePercent: number;
  normalizedConsumption: number; // current adjusted to baseline temp
  efficiencyImprovement: number; // negative = improvement (actual minus normalized)
  efficiencyImprovementPercent: number;
  temperatureAdjustment: number; // magnitude of temp difference impact
  actualCostSavings: number;
  potentialCostSavings: number; // what savings would be with same temp
} {
  const normalizedCurrent = normalizeConsumption(
    current.consumption,
    current.hdd,
    baseline.hdd,
  );

  const actualChange = current.consumption - baseline.consumption;
  const actualChangePercent = (actualChange / baseline.consumption) * 100;

  const efficiency = current.consumption - normalizedCurrent;
  const efficiencyPercent = (efficiency / normalizedCurrent) * 100;

  const tempAdjustment = normalizedCurrent - current.consumption;
  const actualCostSavings = baseline.cost - current.cost;

  // Potential savings if we had made improvements but had baseline temperature
  const potentialCostSavings = baseline.cost - (normalizedCurrent * current.cost / current.consumption);

  return {
    actualConsumptionChange: actualChange,
    actualConsumptionChangePercent: actualChangePercent,
    normalizedConsumption: normalizedCurrent,
    efficiencyImprovement: efficiency,
    efficiencyImprovementPercent: efficiencyPercent,
    temperatureAdjustment: tempAdjustment,
    actualCostSavings: actualCostSavings,
    potentialCostSavings: potentialCostSavings,
  };
}
