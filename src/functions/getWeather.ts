import { fetchWeatherApi } from 'openmeteo';
import { type WeatherData } from '../store';

const PARAMS = {
  latitude: 44.2298, // Kingston, Ontario
  longitude: -76.481, // Kingston, Ontario
  timezone: 'America/New_York',
  // start_date: "2026-01-01",
  // end_date: "2026-03-01",
  daily: 'apparent_temperature_mean',
};
const URL = 'https://archive-api.open-meteo.com/v1/archive';

const getWeather = async (dateRange: [Date, Date]): Promise<WeatherData> => {
  const fetchParams = {
    ...PARAMS,
    start_date: dateRange[0].toISOString().split('T')[0],
    end_date: dateRange[1].toISOString().split('T')[0],
  };

  const responses = await fetchWeatherApi(URL, fetchParams);
  const response = responses[0];

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const daily = response.daily()!;

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const tempArray = daily.variables(0)!.valuesArray();

  return {
    daily: {
      time: Array.from(
        {
          length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
        },
        (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000),
      ),
      apparent_temperature_mean: tempArray ? Array.from(tempArray) : [],
    },
  };
};

export default getWeather;
