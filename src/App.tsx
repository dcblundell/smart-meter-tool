import Papa, { type ParseResult } from 'papaparse';
import './App.css'
import file from '../data/SmartMeter454449-732258_2026-01-0609.42.16.csv?raw';
import { createSignal } from 'solid-js';

const HEADER_MAP: Record<string, string> = {
      'Reading Date': 'Date',
      '12 pm KWH Usage_1': '12 am',
      '[touInquiry_download_Total_Tier_1_Consumption]': 'Tier 1',
      '[touInquiry_download_Total_Tier_2_Consumption]': 'Tier 2',
    };

interface SmartMeterRow {
  "Reading Date": string;
  "1 am KWH Usage": number;
  "2 am KWH Usage": number;
  "3 am KWH Usage": number;
  "4 am KWH Usage": number;
  "5 am KWH Usage": number;
  "6 am KWH Usage": number;
  "7 am KWH Usage": number;
  "8 am KWH Usage": number;
  "9 am KWH Usage": number;
  "10 am KWH Usage": number;
  "11 am KWH Usage": number;
  "12 pm KWH Usage": number;
  "1 pm KWH Usage": number;
  "2 pm KWH Usage": number;
  "3 pm KWH Usage": number;
  "4 pm KWH Usage": number;
  "5 pm KWH Usage": number;
  "6 pm KWH Usage": number;
  "7 pm KWH Usage": number;
  "8 pm KWH Usage": number;
  "9 pm KWH Usage": number;
  "10 pm KWH Usage": number;
  "11 pm KWH Usage": number;
  "12 pm KWH Usage_1": number;
  "[touInquiry_download_Total_Tier_1_Consumption]": number;
  "[touInquiry_download_Total_Tier_2_Consumption]": number;
}

function App() {
  const [csvData, setCsvData] = createSignal<SmartMeterRow[]>([]);
  const [headers, setHeaders] = createSignal<string[]>([]);

  Papa.parse(file, {
  header: true,
  dynamicTyping: true,
  transform: (value: string, column: string) => {
    if (column.includes('KWH')) {
      return formatUnit(value);
    }

    return value;
  },  
  complete: (results: ParseResult<SmartMeterRow>) => {
    const formattedHeaders = results.meta.fields?.map(header => {
      // Check exact matches first
      if (HEADER_MAP[header]) {
        return HEADER_MAP[header];
      }
      
      // Extract time patterns (e.g., "12 pm", "3 am")
      if (header.includes('pm') || header.includes('am')) {
        const timeMatch = header.match(/\d{1,2}\s*(am|pm)/i);
        if (timeMatch) {
          return timeMatch[0];
        }
      }
      
      return header;
    }) || [];

    const data: SmartMeterRow[] = results.data.filter(row => row["Reading Date"]);

    setCsvData(data);
    setHeaders(formattedHeaders);
  }
});

  return (
    <div>
      <h1>Smart Meter Data</h1>
      {csvData().length > 0 && headers().length > 0 ? (
        <table> 
          <thead>
            <tr>
              {headers().map((h) => (<th>{h}</th>))}
            </tr>
          </thead>

          <tbody>
            {csvData().map((row) => (
              <tr>
                {Object.values(row).map((value) => (<td>{value}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{`Loading...`}</p>
      )}
    </div>
  )
}

const formatUnit = (value: string): string => {
    return `${value} kWh`
};

export default App
