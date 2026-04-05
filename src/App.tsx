// import ukData from "../data/SmartMeter475739-757493_2026-02-2209.30.55.csv?raw";
// import gooseVueFile from "../data/119B5C-Vue_Energy_Monitor-1H.csv?raw";
// import ukData from "../data/David-Jan-Mar-2025-SmartMeter454449-732258_2026-03-0712.42.54.csv?raw";
// import ukData from "../data/David-Jan-Mar-2026-SmartMeter454449-732258_2026-03-1123.03.21.csv?raw";
import parseSmartMeterData from './functions/parseSmartMeterData';
import { createSignal } from 'solid-js';
// import parseVueEnergyMonitorData from "./functions/parseVueEnergyMonitorData";
import './styles/App.css';
import { state, setState, resetChartState } from './store';
import { formatPricing } from './functions/math';
import validateUtilitiesKingstonData from './functions/validateUtilitiesKingstonData';
import GasComparisonChart from './components/GasComparisonChart';
import PricingComparisonChart from './components/PricingComparisonChart';

function App() {
  const [error, setError] = createSignal<string | null>(null);
  // Extracted CSV parsing logic
  // parseSmartMeterData(ukData);

  // parseVueEnergyMonitorData(
  //   gooseVueFile,
  //   setMeterData,
  //   setHeaders,
  //   setIsTiered,
  // );

  return (
    <div>
      <h1>Utilities Kingston Meter Data</h1>
      <label for="file-upload">
        <input
          id="file-upload"
          type="file"
          accept=".csv,text/csv"
          onInput={async (e) => {
            setError(null);
            resetChartState();
            const file = e.currentTarget.files?.[0];

            if (!file) return;

            const text = await file.text();

            if (!(await validateUtilitiesKingstonData(text))) {
              setError('Invalid CSV format');
              return;
            }

            parseSmartMeterData(text);
          }}
        />
      </label>
      {error() && (
        <div class="error" style={{ color: 'red' }}>
          {error()}
        </div>
      )}

      {state.meterData === null ? (
        <p>Upload a CSV file to see the data</p>
      ) : (
        <>
          <p>
            {state.isTiered ? 'Tiered billing' : 'TOU billing'} -
            {state.dateRange !== null &&
              `${state.dateRange[0].toLocaleDateString()} => ${state.dateRange[1].toLocaleDateString()}`}
          </p>

          <GasComparisonChart />

          <p>🔥 Gas {formatPricing(state.totalGasCost)}</p>
          <p>⚡ Electricity {formatPricing(state.totalElectricityCost)}</p>
          <p>
            Price difference:{' '}
            <span
              class={state.totalGasCost - state.totalElectricityCost > 0 ? 'positive' : 'negative'}
            >
              {formatPricing(state.totalGasCost - state.totalElectricityCost)}{' '}
              {
                state.totalGasCost - state.totalElectricityCost > 0
                  ? '👍' // Gas more expensive: positive (fire + thumbs up)
                  : '👎' // Electricity more expensive: negative (lightning + thumbs down)
              }
            </span>
          </p>

          <label>
            Baseline Electricity Usage (kWh/day):
            <input
              type="number"
              value={state.baselineElectricityUsageKWh}
              min={0}
              max={100}
              onInput={(e) =>
                setState('baselineElectricityUsageKWh', parseInt(e.currentTarget.value))
              }
            />
          </label>

          <PricingComparisonChart />
        </>
      )}

      {/* <Table /> */}
    </div>
  );
}

export default App;
