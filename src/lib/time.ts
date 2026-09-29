export type TimeFormatOptions = {
  hour12?: boolean;
  timeZone?: string | null;
};

export type TimeParts = {
  hours: string;
  minutes: string;
  seconds: string;
  ampm: '' | 'am' | 'pm';
};

export const timeParts = (d: Date, options: TimeFormatOptions = {}): TimeParts => {
  const hour12 = options.hour12 ?? true;
  const timeZone = options.timeZone ?? undefined;

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
    timeZone,
  });

  const parts = formatter.formatToParts(d);
  const hours = parts.find((part) => part.type === 'hour')?.value ?? '0';
  const minutes = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const seconds = parts.find((part) => part.type === 'second')?.value ?? '00';
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value?.toLowerCase();

  return {
    hours,
    minutes,
    seconds,
    ampm: hour12 && (dayPeriod === 'am' || dayPeriod === 'pm') ? dayPeriod : '',
  };
};
