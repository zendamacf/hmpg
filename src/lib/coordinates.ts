const toNumber = (value: string | null): number | null => {
  if (value == null || value.trim() === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const formatCoordinates = (latitude: string | null, longitude: string | null): string => {
  const lat = toNumber(latitude);
  const lon = toNumber(longitude);
  if (lat == null || lon == null) {
    return '';
  }
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}° ${ns}, ${Math.abs(lon).toFixed(3)}° ${ew}`;
};
