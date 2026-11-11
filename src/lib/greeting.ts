import type { TimeFormatOptions } from './time';

const hourIn = (d: Date, timeZone: string | undefined): number => {
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone,
  })
    .formatToParts(d)
    .find((part) => part.type === 'hour')?.value;
  return Number(hour) % 24;
};

export const greetingFor = (d: Date, options: TimeFormatOptions = {}): string => {
  const hour = hourIn(d, options.timeZone ?? undefined);
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
};
