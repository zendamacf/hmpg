export type UmamiEventData = Record<string, string | number | boolean>;

type UmamiTracker = {
  track: (
    event?:
      | string
      | Record<string, unknown>
      | ((props: Record<string, unknown>) => Record<string, unknown>),
    data?: UmamiEventData,
  ) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/** Umami tracker script URL from a self-hosted instance base URL. */
export const umamiScriptSrc = (baseUrl: string | undefined): string | null => {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return null;
  }
  return `${trimmed.replace(/\/$/, '')}/script.js`;
};

export const trackEvent = (name: string, data?: UmamiEventData): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.umami?.track(name, data);
};
