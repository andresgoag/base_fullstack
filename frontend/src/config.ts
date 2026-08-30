const readRequiredSetting = (
  name: string,
  value: string | undefined,
): string => {
  if (value === undefined || value === "") {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.sample to .env and set it.`,
    );
  }
  return value;
};

export const API_BASE_URL = readRequiredSetting(
  "VITE_API_BASE_URL",
  import.meta.env.VITE_API_BASE_URL,
);

export const WS_BASE_URL = readRequiredSetting(
  "VITE_WEBSOCKET_URL",
  import.meta.env.VITE_WEBSOCKET_URL,
);
