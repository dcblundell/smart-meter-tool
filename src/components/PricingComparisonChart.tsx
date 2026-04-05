import Chart, { type ChartConfiguration } from 'chart.js/auto';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { type TieredSmartMeterRow, type TOUSmartMeterRow, type SmartMeterRow } from '../types/SmartMeter';
import { formatDate, parseLocalDate } from '../functions/Time';
import { state } from '../store';
import getWeather from '../functions/getWeather';
import { COMPARE_RATES_CONFIG } from '../definitions/chart';
import { calculateAlternativePricingCost } from '../functions/pricingComparison';
import { getTierCost, getTOUCost } from './GasComparisonChart';

const CHART_ID = 'comparison-chart';

const PricingComparisonChart = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | null = null;
  const [formattedLabels, setFormattedLabels] = createSignal<string[]>([]);
  const [savingsSummary, setSavingsSummary] = createSignal<{ total: number; percentage: number; cheaper: string } | null>(null);

  createEffect(async () => {
    // @ts-ignore
    const baseline = state.baselineElectricityUsageKWh;

    if (!state.meterData) return;

    let weatherData = state.weatherData;

    if (state.dateRange) {
      weatherData = await getWeather(state.dateRange);

      if (
        weatherData === null ||
        !weatherData?.daily ||
        !weatherData.daily.time ||
        !weatherData.daily.apparent_temperature_mean
      ) {
        console.error('Failed to fetch weather data');
        return;
      }
    }

    const labels = state.meterData.map((row) => formatDate(parseLocalDate(row['Reading Date'])));

    setFormattedLabels(labels);

    if (canvasRef && state.weatherData && state.meterData) {
      if (chart) {
        chart.destroy();
      }
      const { chart: newChart, savings } = generateComparisonChart(
        canvasRef,
        state.meterData,
        state.isTiered,
        formattedLabels(),
      );
      chart = newChart;
      setSavingsSummary(savings);
    }
  });

  onCleanup(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  return (
    <section class="chart-container">
      <h2>Electricity Pricing Comparison</h2>
      <canvas ref={canvasRef} id={CHART_ID}></canvas>
      {savingsSummary() && (
        <div style={{ 'margin-top': '1.5rem', 'margin-left': 'auto', 'margin-right': 'auto', 'padding': '1rem', 'background-color': '#f5f5f5', 'border-radius': '4px', 'max-width': '400px' }}>
          <p style={{ 'margin': '0.5rem 0', 'font-size': '1.1rem', 'color': '#333' }}>
            <strong>Total Savings: </strong>
            ${Math.abs(savingsSummary()!.total).toFixed(2)} ({savingsSummary()!.percentage.toFixed(1)}%)
          </p>
          <p style={{ 'margin': '0.5rem 0', 'font-size': '0.95rem', 'color': '#333' }}>
            <strong>Cheaper method: </strong>
            {savingsSummary()!.cheaper}
          </p>
        </div>
      )}
    </section>
  );
};

const generateComparisonChart = (
  canvasRef: HTMLCanvasElement,
  meterData: SmartMeterRow[],
  isTiered: boolean,
  formattedLabels: string[],
) => {
  // Calculate current pricing method costs
  const currentMethodCosts = meterData.map((row) => {
    const readingDate = parseLocalDate(row['Reading Date']);
    if (isTiered) {
      return getTierCost(row as TieredSmartMeterRow, readingDate);
    } else {
      return getTOUCost(row as TOUSmartMeterRow, readingDate);
    }
  });

  // For alternative method when converting TOU to Tiered, track cumulative monthly usage
  let cumulativeMonthlyUsage = 0;
  let currentMonth = '';

  const alternativeMethodCosts = meterData.map((row) => {
    const readingDate = parseLocalDate(row['Reading Date']);
    const monthKey = `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`;

    // Reset cumulative when month changes
    if (monthKey !== currentMonth) {
      cumulativeMonthlyUsage = 0;
      currentMonth = monthKey;
    }

    // Get total daily usage to track cumulative (only for TOU data)
    if (!isTiered) {
      const touRow = row as TOUSmartMeterRow;
      const onPeak = touRow['Total On-Peak kwH Usage'] || 0;
      const midPeak = touRow['Total Mid-Peak kwH Usage'] || 0;
      const offPeak = touRow['Total Off-Peak kwH Usage *'] || 0;
      const totalDailyUsage = onPeak + midPeak + offPeak;

      const cost = calculateAlternativePricingCost(row, readingDate, isTiered, state.baselineElectricityUsageKWh, cumulativeMonthlyUsage);

      // Update cumulative for next iteration
      cumulativeMonthlyUsage += totalDailyUsage;

      return cost;
    } else {
      // For tiered data, no cumulative tracking needed
      return calculateAlternativePricingCost(row, readingDate, isTiered, state.baselineElectricityUsageKWh, 0);
    }
  });

  const currentMethodLabel = isTiered ? 'Tiered (current)' : 'TOU (current)';
  const alternativeMethodLabel = isTiered ? 'TOU (alternative)' : 'Tiered (alternative)';

  const chartConfig: ChartConfiguration<'line'> = {
    ...COMPARE_RATES_CONFIG,
    data: {
      labels: formattedLabels,
      datasets: [
        {
          label: currentMethodLabel,
          data: currentMethodCosts,
          yAxisID: 'y',
          borderColor: '#4bc0c0',
          backgroundColor: '#4bc0c033',
          pointRadius: 1,
          order: 1,
        },
        {
          label: alternativeMethodLabel,
          data: alternativeMethodCosts,
          yAxisID: 'y',
          borderColor: '#ff6384',
          backgroundColor: '#ff638433',
          pointRadius: 1,
          order: 2,
        },
      ],
    },
  };

  const newChart = new Chart(canvasRef, chartConfig);

  // Calculate totals
  const totalCurrentMethod = currentMethodCosts.reduce((a, b) => a + b, 0);
  const totalAlternativeMethod = alternativeMethodCosts.reduce((a, b) => a + b, 0);
  const totalSavings = totalCurrentMethod - totalAlternativeMethod;
  const savingsPercentage = totalCurrentMethod > 0 ? (totalSavings / totalCurrentMethod) * 100 : 0;

  console.log(
    `Pricing Comparison:\n` +
    `Current Method (${currentMethodLabel}): $${totalCurrentMethod.toFixed(2)}\n` +
    `Alternative Method (${alternativeMethodLabel}): $${totalAlternativeMethod.toFixed(2)}\n` +
    `Savings: $${totalSavings.toFixed(2)} (${savingsPercentage.toFixed(2)}%)\n` +
    `Cheaper: ${totalSavings > 0 ? alternativeMethodLabel : currentMethodLabel}`,
  );

  return {
    chart: newChart,
    savings: {
      total: totalSavings,
      percentage: savingsPercentage,
      cheaper: (totalSavings > 0 ? alternativeMethodLabel : currentMethodLabel).split(' ')[0], // Just return "TOU" or "Tiered"
    },
  };
};

export default PricingComparisonChart;
