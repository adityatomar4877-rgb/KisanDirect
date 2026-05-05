// ─── data.gov.in API CONFIG ───────────────────────────────────────────────
import Constants from 'expo-constants';

const DATA_GOV_API_KEY =
  process.env.EXPO_PUBLIC_DATA_GOV_API_KEY ||
  Constants.expoConfig?.extra?.dataGovApiKey ||
  '';

const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource';
const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const DEFAULT_STATE = 'Madhya Pradesh';
export const DEFAULT_DISTRICT = 'Gwalior';

export const fetchMandiPrice = async (commodity, state = DEFAULT_STATE) => {
  const params = new URLSearchParams({
    'api-key': DATA_GOV_API_KEY,
    format: 'json',
    limit: '10',
    'filters[state]': state,
    'filters[commodity]': commodity,
  });
  const url = `${DATA_GOV_BASE_URL}/${AGMARKNET_RESOURCE_ID}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const json = await response.json();
  return json.records || [];
};
