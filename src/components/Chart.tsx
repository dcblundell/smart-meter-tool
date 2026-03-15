import Chart, { type ChartConfiguration } from 'chart.js/auto';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { type TOUSmartMeterRow, type TieredSmartMeterRow, type SmartMeterRow, READING_DATE_KEY, TOTAL_TIER_1_KEY, TOTAL_TIER_2_KEY } from '../types/SmartMeter';
import { GAS_EFFICIENCY, GAS_KWH_PER_M3, GasPricingBlocks } from '../types/Gas';
import { formatDate, parseLocalDate } from '../functions/Time';
import { TierRate, TierThreshold, TimeOfUse, TOURate } from '../types/Electricity';
import { state, setState } from '../store';
import getWeather from '../functions/getWeather';
import { LINE_CHART_CONFIG } from '../definitions/chart';
import { getDynamicCOP } from '../types/HeatPumps';

const CHART_ID = 'temp';

const ChartComponent = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | null = null;
  const [formattedLabels, setFormattedLabels] = createSignal<string[]>([]);
  const [temperatureData, setTemperatureData] = createSignal<number[]>([]);

  createEffect(async () => {
    // @ts-ignore - triggers the effect when baselineElectricityUsageKWh changes, refactor later
    const baseline = state.baselineElectricityUsageKWh;
    
    if (!state.meterData) return;

    let weatherData = state.weatherData;

    if (state.dateRange) {
      weatherData = await getWeather(state.dateRange);
      setState('weatherData', weatherData);

      if (weatherData === null || !weatherData?.daily || !weatherData.daily.time || !weatherData.daily.apparent_temperature_mean) {
        console.error('Failed to fetch weather data');
        return;
      }

      const data = state.meterData.map((row) => {
        const readingDate = new Date(row[READING_DATE_KEY]);
        const closestTempIndex = weatherData?.daily.time.reduce((nearest, current, i) => {
          const readingDateTime = readingDate.getTime();
          const currentTime = current.getTime();
          const timeDiff = Math.abs(currentTime - readingDateTime);
          const nearestTime = weatherData?.daily.time[nearest].getTime();

          if (nearestTime === undefined) return i;

          const nearestDiff = Math.abs(nearestTime - readingDateTime);
          return timeDiff < nearestDiff ? i : nearest;
        }, 0);

        if (
          typeof closestTempIndex === 'number' &&
          Array.isArray(weatherData?.daily.apparent_temperature_mean) &&
          weatherData?.daily.apparent_temperature_mean[closestTempIndex] !== undefined
        ) {
          return weatherData.daily.apparent_temperature_mean[closestTempIndex];
        }
        return null;
      });

      if (data) {
        setTemperatureData(data.filter((v): v is number => v !== null));
      }
    }

    const labels = state.meterData.map((row) => formatDate(parseLocalDate(row[READING_DATE_KEY])));

    setFormattedLabels(labels);

    if (canvasRef && state.weatherData && state.meterData) {
      if (chart) {
        chart.destroy();
      }
      chart = generateChart(
        canvasRef,
        state.meterData,
        state.isTiered,
        formattedLabels(),
        temperatureData(),
        chart,
      );
    }
  });

  // Cleanup chart on component unmount
  onCleanup(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  return (
    <section class="chart-container">
      <canvas ref={canvasRef} id={CHART_ID}></canvas>
    </section>
  );
};

const generateChart = (
  canvasRef: HTMLCanvasElement,
  meterData: SmartMeterRow[],
  isTiered: boolean,
  formattedLabels: string[],
  temperatureData: number[],
  chart?: Chart | null,
) => {
  // Adjusted electric cost: only the electricity used for heating
  const electricCostArr = isTiered
    ? (meterData as TieredSmartMeterRow[]).map(getTierCost)
    : (meterData as TOUSmartMeterRow[]).map(getTOUCost);
  // const cumulativeElectricCost = electricCostArr.reduce((acc, val) => {
  //   if (acc.length === 0) return [val];
  //   acc.push(acc[acc.length - 1] + val);
  //   return acc;
  // }, [] as number[]);

  // Cumulative gas cost (using heat delivered by heat pump with dynamic COP)
  // const cumulativeGasCostArr = calculateCumulativeGasCost(
  //   meterData,
  //   weatherData,
  //   isTiered,
  // );

  const gasCostData = meterData.map((row, index) => {
    const tempC = temperatureData[index];
    const kWhUsedForHeating = isTiered
      ? getTierConsumption(row as TieredSmartMeterRow)
      : getTOUConsumption(row as TOUSmartMeterRow);
    const heatDelivered = kWhUsedForHeating * getDynamicCOP(tempC);
    const gasM3 = heatDelivered / (GAS_EFFICIENCY * GAS_KWH_PER_M3);
    const cost = getEstimatedGasCost(gasM3);

    return cost;
  });

  const chartConfig: ChartConfiguration<'line'> = {
    ...LINE_CHART_CONFIG,
    data: {
      labels: formattedLabels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temperatureData,
          yAxisID: 'y',
          borderColor: '#36a2eb',
          backgroundColor: '#36a2eb33',
          pointRadius: 1,
          order: 1,
        },
        // {
        //   label: "Heating kWh Delivered (COP-adjusted)",
        //   data: heatingKWhArr,
        //   yAxisID: "y2",
        //   borderColor: "#ffa600",
        //   backgroundColor: "#ffa60033",
        //   pointRadius: 1,
        //   order: 2,
        // },
        {
          label: 'Electricity Cost ($)',
          data: electricCostArr,
          yAxisID: 'y1',
          borderColor: '#4bc0c0',
          backgroundColor: '#4bc0c033',
          pointRadius: 1,
          order: 3,
        },
        {
          label: 'Estimated Gas Cost ($)',
          data: gasCostData,
          yAxisID: 'y1',
          borderColor: '#ff6384',
          backgroundColor: '#ff638433',
          pointRadius: 1,
          order: 4,
        },
        // {
        //   label: "Cumulative Electric Cost ($)",
        //   data: cumulativeElectricCost,
        //   yAxisID: "y1",
        //   borderColor: "#0057b8",
        //   backgroundColor: "#0057b833",
        //   borderDash: [5, 5],
        //   pointRadius: 0,
        //   order: 5,
        // },
        // {
        //   label: "Cumulative Gas Cost ($)",
        //   data: cumulativeGasCostArr,
        //   yAxisID: "y1",
        //   borderColor: "#b80000",
        //   backgroundColor: "#b8000033",
        //   borderDash: [5, 5],
        //   pointRadius: 0,
        //   order: 6,
        // },
      ],
    },
  };

  if (chart) {
    chart.destroy();
  }

  const newChart = new Chart(canvasRef, chartConfig);

  setState('totalGasCost', gasCostData?.length > 0 ? gasCostData.reduce((a, b) => a + b, 0) : 0);
  setState(
    'totalElectricityCost',
    electricCostArr?.length > 0 ? electricCostArr.reduce((a, b) => a + b, 0) : 0,
  );

  return newChart;
};

const getEstimatedGasCost = (
  gasM3: number,
) => {
  return gasM3 * GasPricingBlocks[0].price; // Simplified: using first block price for estimation
};

// Helper to calculate tier heating values
const getTierHeating = (tier1: number, tier2: number) => {
  const baseline = state.baselineElectricityUsageKWh;
  let tier1Heating = 0;
  let tier2Heating = 0;
  if (tier1 > 0 && tier2 > 0) {
    // Split baseline evenly
    const split = baseline / 2;
    tier1Heating = Math.max(0, tier1 - split);
    tier2Heating = Math.max(0, tier2 - split);
  } else {
    // If only one tier has value, subtract all baseline from it
    if (tier1 > 0) {
      tier1Heating = Math.max(0, tier1 - baseline);
      tier2Heating = tier2;
    } else {
      tier1Heating = 0;
      tier2Heating = Math.max(0, tier2 - baseline);
    }
  }
  return { tier1Heating, tier2Heating };
};

const getTierConsumption = (row: TieredSmartMeterRow) => {
  const tier1 = row[TOTAL_TIER_1_KEY];
  const tier2 = row[TOTAL_TIER_2_KEY];
  const { tier1Heating, tier2Heating } = getTierHeating(tier1, tier2);
  return tier1Heating + tier2Heating;
};

const getTierCost = (row: TieredSmartMeterRow) => {
  const tier1 = row[TOTAL_TIER_1_KEY];
  const tier2 = row[TOTAL_TIER_2_KEY];
  const { tier1Heating, tier2Heating } = getTierHeating(tier1, tier2);
  return (
    tier1Heating * TierRate[TierThreshold.TIER_1] + tier2Heating * TierRate[TierThreshold.TIER_2]
  );
};

const getTOUConsumption = (row: TOUSmartMeterRow) => {
  const onPeak = row['Total On-Peak kwH Usage'] || 0;
  const midPeak = row['Total Mid-Peak kwH Usage'] || 0;
  const offPeak = row['Total Off-Peak kwH Usage *'] || 0;
  const baseline = state.baselineElectricityUsageKWh;

  // Split baseline evenly across all periods with usage
  const periods = [onPeak, midPeak, offPeak];
  const usedPeriods = periods.filter((v) => v > 0).length;
  const split = usedPeriods > 0 ? baseline / usedPeriods : 0;

  let onPeakHeating = onPeak > 0 ? Math.max(0, onPeak - split) : 0;
  let midPeakHeating = midPeak > 0 ? Math.max(0, midPeak - split) : 0;
  let offPeakHeating = offPeak > 0 ? Math.max(0, offPeak - split) : 0;

  return onPeakHeating + midPeakHeating + offPeakHeating;
};

const getTOUCost = (row: TOUSmartMeterRow) => {
  const onPeak = row['Total On-Peak kwH Usage'] || 0;
  const midPeak = row['Total Mid-Peak kwH Usage'] || 0;
  const offPeak = row['Total Off-Peak kwH Usage *'] || 0;
  const baseline = state.baselineElectricityUsageKWh;

  // Split baseline evenly across all periods with usage
  const periods = [onPeak, midPeak, offPeak];
  const usedPeriods = periods.filter((v) => v > 0).length;
  const split = usedPeriods > 0 ? baseline / usedPeriods : 0;

  let onPeakHeating = onPeak > 0 ? Math.max(0, onPeak - split) : 0;
  let midPeakHeating = midPeak > 0 ? Math.max(0, midPeak - split) : 0;
  let offPeakHeating = offPeak > 0 ? Math.max(0, offPeak - split) : 0;

  return (
    onPeakHeating * TOURate[TimeOfUse.ON_PEAK] +
    midPeakHeating * TOURate[TimeOfUse.MID_PEAK] +
    offPeakHeating * TOURate[TimeOfUse.OFF_PEAK]
  );
};

// Calculate cumulative gas cost array (supports Tiered and TOU)
// const calculateCumulativeGasCost = (
//   meterData: SmartMeterRow[],
//   weatherData: typeof import("../../data/weather.json"),
//   isTiered: boolean,
// ) => {
//   let cumulativeGas = 0;
//   let runningGasCost = 0;
//   const cumulativeGasCostArr: number[] = [];

//   meterData.forEach((row, i) => {
//     const kWhUsedForHeating = isTiered
//       ? getTierConsumption(row as TieredSmartMeterRow)
//       : getTOUConsumption(row as TOUSmartMeterRow);
//     const tempC = weatherData.daily.apparent_temperature_mean[i];
//     const dynamicCOP = getDynamicCOP(tempC);
//     const heatDelivered = kWhUsedForHeating * dynamicCOP;
//     // Convert heat delivered to gas m³
//     const gasM3 = heatDelivered / (GAS_KWH_PER_M3 * GAS_EFFICIENCY);
//     let remaining = gasM3;
//     let cost = 0;
//     let blockStart = cumulativeGas;
//     for (const block of GasPricingBlocks) {
//       const blockEnd = blockStart + block.limit;
//       const blockUsage = Math.min(remaining, blockEnd - blockStart);
//       if (blockUsage > 0) {
//         cost += blockUsage * block.price;
//         remaining -= blockUsage;
//         blockStart += blockUsage;
//       }
//       if (remaining <= 0) break;
//     }
//     cumulativeGas += gasM3;
//     runningGasCost += cost;
//     cumulativeGasCostArr.push(runningGasCost);
//   });
//   return cumulativeGasCostArr;
// };

export default ChartComponent;
