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

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const dateLabel = (d: Date, options: TimeFormatOptions = {}): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: options.timeZone ?? undefined,
  }).format(d);

export const supportedTimeZones = (): string[] => {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try {
    return intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    return [];
  }
};

/** Whole days since 1970-01-01 for the calendar date in the given time zone. */
export const dayNumber = (d: Date, options: TimeFormatOptions = {}): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: options.timeZone ?? undefined,
  }).formatToParts(d);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Math.floor(Date.UTC(part('year'), part('month') - 1, part('day')) / 86_400_000);
};
