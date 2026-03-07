import "./styles/App.css";
import gooseFile from "../data/SmartMeter475739-757493_2026-02-2209?raw";
import gooseVueFile from "../data/VueEnergyMonitor_2026-02-22.csv?raw";
import { createSignal } from "solid-js";
import ChartComponent from "./components/Chart";
import type { SmartMeterRow } from "./types/SmartMeter";
import parseSmartMeterData from "./functions/parseSmartMeterData";
import parseVueEnergyMonitorData from "./functions/parseVueEnergyMonitorData";

function App() {
  const [meterData, setMeterData] = createSignal<SmartMeterRow[]>([]);
  const [headers, setHeaders] = createSignal<string[]>([]);
  const [isTiered, setIsTiered] = createSignal(false);

  // Extracted CSV parsing logic
  parseSmartMeterData(
    gooseFile,
    setMeterData,
    setHeaders,
    setIsTiered,
    isTiered,
  );

  parseVueEnergyMonitorData(gooseVueFile);

  return (
    <div>
      <h1>Smart Meter Data</h1>
      <p>{isTiered() ? "Tiered billing" : "TOU billing"}</p>

      <ChartComponent meterData={meterData()} isTiered={isTiered()} />

      {meterData().length > 0 && headers().length > 0 ? (
        <table>
          <thead>
            <tr>
              {headers().map((h) => (
                <th>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {meterData().map((row) => (
              <tr>
                {Object.values(row).map((value) => (
                  <td>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{`Loading...`}</p>
      )}
    </div>
  );
}

export default App;
