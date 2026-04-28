import { createEffect, createSignal } from 'solid-js';
import { state } from '../store';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { calculateHDDFromWeather, analyzeEfficiencyImprovement } from '../functions/temperatureNormalization';
import { TOTAL_TIER_1_KEY, TOTAL_TIER_2_KEY, type TieredSmartMeterRow, type TOUSmartMeterRow } from '../types/SmartMeter';
import { formatPricing } from '../functions/math';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface EfficiencyAnalysis {
  actualConsumptionChange: number;
  actualConsumptionChangePercent: number;
  normalizedConsumption: number;
  efficiencyImprovement: number;
  efficiencyImprovementPercent: number;
  temperatureAdjustment: number;
  actualCostSavings: number;
  potentialCostSavings: number;
}

const getTierConsumption = (row: TieredSmartMeterRow) => {
  const tier1 = row[TOTAL_TIER_1_KEY];
  const tier2 = row[TOTAL_TIER_2_KEY];
  // Parse if they're strings with units
  const t1 = typeof tier1 === 'string' ? parseFloat((tier1 as string).replace(' kWh', '')) : (tier1 as number);
  const t2 = typeof tier2 === 'string' ? parseFloat((tier2 as string).replace(' kWh', '')) : (tier2 as number);
  return (isNaN(t1) ? 0 : t1) + (isNaN(t2) ? 0 : t2);
};

const getTOUConsumption = (row: TOUSmartMeterRow) => {
  const onPeak = (row['Total On-Peak kwH Usage'] || 0) as number | string;
  const midPeak = (row['Total Mid-Peak kwH Usage'] || 0) as number | string;
  const offPeak = (row['Total Off-Peak kwH Usage *'] || 0) as number | string;
  
  const onPeakVal = typeof onPeak === 'string' ? parseFloat(onPeak.replace(' kWh', '')) : onPeak;
  const midPeakVal = typeof midPeak === 'string' ? parseFloat(midPeak.replace(' kWh', '')) : midPeak;
  const offPeakVal = typeof offPeak === 'string' ? parseFloat(offPeak.replace(' kWh', '')) : offPeak;
  
  return (isNaN(onPeakVal) ? 0 : onPeakVal) + (isNaN(midPeakVal) ? 0 : midPeakVal) + (isNaN(offPeakVal) ? 0 : offPeakVal);
};

export default function TemperatureComparisonChart() {
  const [analysis, setAnalysis] = createSignal<EfficiencyAnalysis | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: ChartJS | null = null;

  createEffect(async () => {
    try {
      setLoading(true);
      setError(null);

      if (
        !state.meterData ||
        !state.comparisonMeterData ||
        !state.weatherData ||
        !state.comparisonWeatherData ||
        !state.dateRange ||
        !state.comparisonDateRange
      ) {
        setError('Missing data for comparison');
        setLoading(false);
        return;
      }

      // Calculate total electricity consumption for each period
      const baselineConsumption = state.meterData.reduce((sum, row) => {
        const consumption = state.isTiered
          ? getTierConsumption(row as TieredSmartMeterRow)
          : getTOUConsumption(row as TOUSmartMeterRow);
        return sum + consumption;
      }, 0);

      const comparisonConsumption = state.comparisonMeterData.reduce((sum, row) => {
        const consumption = state.comparisonIsTiered
          ? getTierConsumption(row as TieredSmartMeterRow)
          : getTOUConsumption(row as TOUSmartMeterRow);
        return sum + consumption;
      }, 0);

      // Calculate total electricity cost for each period
      const baselineCost = state.totalElectricityCost;
      const comparisonCost = baselineConsumption > 0 ? baselineCost * (comparisonConsumption / baselineConsumption) : 0;

      // Get HDD for each period
      const baselineHDD = calculateHDDFromWeather(state.weatherData, state.dateRange);
      const comparisonHDD = calculateHDDFromWeather(state.comparisonWeatherData, state.comparisonDateRange);

      // Create baseline and comparison consumption objects for analyzeEfficiencyImprovement
      const baselineData = {
        consumption: baselineConsumption,
        hdd: baselineHDD,
        cost: baselineCost,
      };

      const comparisonData = {
        consumption: comparisonConsumption,
        hdd: comparisonHDD,
        cost: comparisonCost,
      };

      // Calculate efficiency improvement
      const efficiencyAnalysis = analyzeEfficiencyImprovement(baselineData, comparisonData);
      setAnalysis(efficiencyAnalysis);

      // Create chart data for comparison
      const chartData = {
        labels: ['Actual Consumption', 'Normalized Consumption'],
        datasets: [
          {
            label: 'Baseline Period',
            data: [baselineConsumption, baselineConsumption],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            pointRadius: 6,
            pointBackgroundColor: '#3b82f6',
          },
          {
            label: 'Comparison Period',
            data: [comparisonConsumption, efficiencyAnalysis.normalizedConsumption],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: false,
            pointRadius: 6,
            pointBackgroundColor: '#ef4444',
          },
        ],
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Temperature-Normalized Consumption Comparison',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Total kWh',
            },
          },
        },
      };

      if (canvasRef) {
        if (chartInstance) {
          chartInstance.destroy();
        }
        const ctx = canvasRef.getContext('2d');
        if (ctx) {
          chartInstance = new ChartJS(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions,
          });
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error analyzing temperature comparison:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  });

  return (
    <section class="chart-container">
      <h2>Temperature-Normalized Efficiency Analysis</h2>

      {loading() && <p>Analyzing data...</p>}
      {error() && <p style={{ color: 'red' }}>{error()}</p>}

      {!loading() && !error() && analysis() && (
        <>
          <canvas ref={canvasRef} width="400" height="200"></canvas>

          <div class="info-box">
            <h3>Efficiency Improvement Analysis</h3>

            <p>
              <strong>Actual Consumption Change:</strong><br />
              {analysis()!.actualConsumptionChange > 0 ? '↑' : '↓'} {Math.abs(analysis()!.actualConsumptionChange).toFixed(2)} kWh
              <br />
              ({analysis()!.actualConsumptionChangePercent > 0 ? '+' : ''}{analysis()!.actualConsumptionChangePercent.toFixed(1)}%)
            </p>

            <p>
              <strong>Temperature-Adjusted Consumption:</strong><br />
              {analysis()!.normalizedConsumption.toFixed(2)} kWh
              <br />
              <small>(comparison period at baseline temperature)</small>
            </p>

            <p style={{ color: analysis()!.efficiencyImprovement > 0 ? '#22c55e' : '#ef4444', 'font-weight': 'bold' }}>
              <strong>Real Efficiency Improvement:</strong><br />
              {analysis()!.efficiencyImprovement > 0 ? '✓' : ''} {analysis()!.efficiencyImprovement.toFixed(2)} kWh
              <br />
              ({analysis()!.efficiencyImprovementPercent > 0 ? '+' : ''}{analysis()!.efficiencyImprovementPercent.toFixed(1)}%)
            </p>

            <p>
              <strong>Temperature Impact:</strong><br />
              {analysis()!.temperatureAdjustment.toFixed(2)} kWh
              <br />
              <small>(heating need difference)</small>
            </p>

            {analysis()!.actualCostSavings > 0 && (
              <p style={{ color: '#22c55e', 'font-weight': 'bold' }}>
                <strong>Estimated Cost Savings:</strong><br />
                {formatPricing(analysis()!.actualCostSavings)} actual
                <br />
                {formatPricing(analysis()!.potentialCostSavings)} if normalized
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
