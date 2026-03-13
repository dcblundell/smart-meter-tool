export const unixToTimezone = (unixTime: number, offsetSeconds: number = 0) => {
  // Convert unixtime to milliseconds
  const utcMillis = unixTime * 1000;

  // Apply offset
  const localMillis = utcMillis + offsetSeconds * 1000;
  const date = new Date(localMillis);

  // Format to YYYY-MM-DD:HH:MM
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};
