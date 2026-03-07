import Chart from "chart.js/auto";
import weatherData from "../../data/weather.json";
import { onMount } from "solid-js";
import type {
  TOUSmartMeterRow,
  TieredSmartMeterRow,
  SmartMeterRow,
} from "../types/SmartMeter";
import { GAS_EFFICIENCY, GAS_KWH_PER_M3, GasPricingBlocks } from "../types/Gas";
import { getDynamicCOP } from "../types/HeatPumps";
import { unixToTimezone } from "../functions/Time";
import {
  TierRate,
  TierThreshold,
  TimeOfUse,
  TOURate,
} from "../types/Electricity";

const CHART_ID = "temp";
const BASE_ELECTRICITY_USAGE_KWH = 20;

const ChartComponent = ({
  meterData,
  isTiered,
}: {
  meterData: SmartMeterRow[];
  isTiered: boolean;
}) => {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvasRef) {
      const offsetSeconds = weatherData.utc_offset_seconds || 0;
      const formattedLabels = weatherData.daily.time.map((unixTime) =>
        unixToTimezone(unixTime, offsetSeconds),
      );

      // Heating kWh delivered (above baseline, adjusted for dynamic COP)
      // const heatingKWhArr = meterData.map((row, i) => {
      //   let tier1 = row["[touInquiry_download_Total_Tier_1_Consumption]"];
      //   let tier2 = row["[touInquiry_download_Total_Tier_2_Consumption]"];
      //   let baseline = BASE_ELECTRICITY_USAGE_KWH;
      //   let tier1Heating = Math.max(0, tier1 - baseline);
      //   baseline = Math.max(0, baseline - tier1);
      //   let tier2Heating = Math.max(0, tier2 - baseline);
      //   const electricUsed = tier1Heating + tier2Heating;
      //   // Use daily apparent temperature for COP
      //   const tempC = weatherData.daily.apparent_temperature_mean[i];
      //   const dynamicCOP = getDynamicCOP(tempC);
      //   return electricUsed * dynamicCOP;
      // });

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

      new Chart(canvasRef, {
        type: "line",
        data: {
          labels: formattedLabels,
          datasets: [
            {
              label: "Apparent Temperature (°C)",
              data: weatherData.daily.apparent_temperature_mean,
              yAxisID: "y",
              borderColor: "#36a2eb",
              backgroundColor: "#36a2eb33",
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
              label: "Electricity Cost ($)",
              data: electricCostArr,
              yAxisID: "y1",
              borderColor: "#4bc0c0",
              backgroundColor: "#4bc0c033",
              pointRadius: 1,
              order: 3,
            },
            {
              label: "Estimated Gas Cost ($)",
              data: (() => {
                let cumulativeGas = 0;
                return meterData.map((row, index) =>
                  getEstimatedGasCost(row, cumulativeGas, index, isTiered),
                );
              })(),
              yAxisID: "y1",
              borderColor: "#ff6384",
              backgroundColor: "#ff638433",
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
        options: {
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Temperature (°C)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Cost ($)",
              },
            },
            // y2: {
            //   type: "linear",
            //   display: true,
            //   position: "right",
            //   grid: {
            //     drawOnChartArea: false,
            //   },
            //   title: {
            //     display: true,
            //     text: "Heating kWh",
            //   },
            //   offset: true,
            // },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) label += ": ";
                  if (context.parsed.y != null)
                    label += context.parsed.y.toFixed(2);
                  return label;
                },
              },
            },
          },
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
          },
        },
      });
    }
  });

  return <canvas ref={canvasRef} id={CHART_ID}></canvas>;
};

const getEstimatedGasCost = (
  row: SmartMeterRow,
  cumulativeGas: number,
  i: number,
  isTiered: boolean,
) => {
  const electricUsed = isTiered
    ? getTierConsumption(row as TieredSmartMeterRow)
    : getTOUConsumption(row as TOUSmartMeterRow);
  const tempC = weatherData.daily.apparent_temperature_mean[i];
  const dynamicCOP = getDynamicCOP(tempC);
  const heatDelivered = electricUsed * dynamicCOP;
  const gasM3 = heatDelivered / (GAS_KWH_PER_M3 * GAS_EFFICIENCY);

  let remaining = gasM3;
  let cost = 0;
  let blockStart = cumulativeGas;

  for (const block of GasPricingBlocks) {
    const blockEnd = blockStart + block.limit;
    const blockUsage = Math.min(remaining, blockEnd - blockStart);
    if (blockUsage > 0) {
      cost += blockUsage * block.price;
      remaining -= blockUsage;
      blockStart += blockUsage;
    }
    if (remaining <= 0) break;
  }

  cumulativeGas += gasM3;

  return cost;
};

// Helper to calculate tier heating values
const getTierHeating = (tier1: number, tier2: number, baseline: number) => {
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
  const tier1 = row["[touInquiry_download_Total_Tier_1_Consumption]"];
  const tier2 = row["[touInquiry_download_Total_Tier_2_Consumption]"];
  const baseline = BASE_ELECTRICITY_USAGE_KWH;
  const { tier1Heating, tier2Heating } = getTierHeating(tier1, tier2, baseline);

  return tier1Heating + tier2Heating;
};

const getTierCost = (row: TieredSmartMeterRow) => {
  const tier1 = row["[touInquiry_download_Total_Tier_1_Consumption]"];
  const tier2 = row["[touInquiry_download_Total_Tier_2_Consumption]"];
  const baseline = BASE_ELECTRICITY_USAGE_KWH;
  const { tier1Heating, tier2Heating } = getTierHeating(tier1, tier2, baseline);

  return (
    tier1Heating * TierRate[TierThreshold.TIER_1] +
    tier2Heating * TierRate[TierThreshold.TIER_2]
  );
};

const getTOUConsumption = (row: TOUSmartMeterRow) => {
  const onPeak = row["Total On-Peak kwH Usage"] || 0;
  const midPeak = row["Total Mid-Peak kwH Usage"] || 0;
  const offPeak = row["Total Off-Peak kwH Usage *"] || 0;
  const baseline = BASE_ELECTRICITY_USAGE_KWH;

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
  const onPeak = row["Total On-Peak kwH Usage"] || 0;
  const midPeak = row["Total Mid-Peak kwH Usage"] || 0;
  const offPeak = row["Total Off-Peak kwH Usage *"] || 0;
  const baseline = BASE_ELECTRICITY_USAGE_KWH;

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
const calculateCumulativeGasCost = (
  meterData: SmartMeterRow[],
  weatherData: typeof import("../../data/weather.json"),
  isTiered: boolean,
) => {
  let cumulativeGas = 0;
  let runningGasCost = 0;
  const cumulativeGasCostArr: number[] = [];

  meterData.forEach((row, i) => {
    const electricUsed = isTiered
      ? getTierConsumption(row as TieredSmartMeterRow)
      : getTOUConsumption(row as TOUSmartMeterRow);
    const tempC = weatherData.daily.apparent_temperature_mean[i];
    const dynamicCOP = getDynamicCOP(tempC);
    const heatDelivered = electricUsed * dynamicCOP;
    // Convert heat delivered to gas m³
    const gasM3 = heatDelivered / (GAS_KWH_PER_M3 * GAS_EFFICIENCY);
    let remaining = gasM3;
    let cost = 0;
    let blockStart = cumulativeGas;
    for (const block of GasPricingBlocks) {
      const blockEnd = blockStart + block.limit;
      const blockUsage = Math.min(remaining, blockEnd - blockStart);
      if (blockUsage > 0) {
        cost += blockUsage * block.price;
        remaining -= blockUsage;
        blockStart += blockUsage;
      }
      if (remaining <= 0) break;
    }
    cumulativeGas += gasM3;
    runningGasCost += cost;
    cumulativeGasCostArr.push(runningGasCost);
  });
  return cumulativeGasCostArr;
};

export default ChartComponent;
