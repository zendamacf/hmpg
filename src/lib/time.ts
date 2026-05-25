export type TimeParts = {
  hours: number;
  minutes: string;
  seconds: string;
  ampm: 'am' | 'pm';
};

export const timeParts = (d: Date): TimeParts => {
  let hours = d.getHours();
  const minutes = `0${d.getMinutes()}`.slice(-2);
  const seconds = `0${d.getSeconds()}`.slice(-2);
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return { hours, minutes, seconds, ampm };
};
