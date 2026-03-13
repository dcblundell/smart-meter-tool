import gooseFile from "../data/SmartMeter475739-757493_2026-02-2209.30.55.csv?raw";
// import gooseVueFile from "../data/119B5C-Vue_Energy_Monitor-1H.csv?raw";
// import davidJanMar2025 from "../data/David-Jan-Mar-2025-SmartMeter454449-732258_2026-03-0712.42.54.csv?raw";
// import davidJanMar2026 from "../data/David-Jan-Mar-2026-SmartMeter454449-732258_2026-03-1123.03.21.csv?raw";
import ChartComponent from "./components/Chart";
import parseSmartMeterData from "./functions/parseSmartMeterData";
// import parseVueEnergyMonitorData from "./functions/parseVueEnergyMonitorData";
import "./styles/App.css";
import { state } from "./store";

function App() {
  // Extracted CSV parsing logic
  parseSmartMeterData(gooseFile);

  // parseVueEnergyMonitorData(
  //   gooseVueFile,
  //   setMeterData,
  //   setHeaders,
  //   setIsTiered,
  // );

  return (
    <div>
      <h1>Smart Meter Data</h1>
      <p>{state.isTiered ? "Tiered billing" : "TOU billing"}</p>
      <p>Total Gas Cost: ${state.totalGasCost.toFixed(2)}</p>
      <p>Total Electricity Cost: ${state.totalElectricityCost.toFixed(2)}</p>
      <p>
        {state.dateRange !== null &&
          `${state.dateRange[0].toLocaleDateString()} => ${state.dateRange[1].toLocaleDateString()}`}
      </p>

      <ChartComponent meterData={state.meterData} isTiered={state.isTiered} />

      {/* {state.meterData.length > 0 && state.headers.length > 0 ? (
        <table>
          <thead>
            <tr>
              {state.headers.map((h) => (
                <th>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {state.meterData.map((row) => (
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
      )} */}
    </div>
  );
}

export default App;
