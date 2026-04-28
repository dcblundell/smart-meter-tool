// Parse as local date to avoid timezone issues
// TODO: Use Temporal or dayjs?
export const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);

  return new Date(year, month - 1, day);
};

// Format to YYYY-MM-DD:HH:MM
export const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
