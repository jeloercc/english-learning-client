// ─── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

// ─── Unified Dictionary (MW Learners + Free Dictionary fallback) ──────────────

export interface UnifiedDefinition {
  definition: string;
  example?: string | null;
  partOfSpeech?: string;
}

export interface UnifiedIdiom {
  phrase: string;
  definition: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string | null;
  audioUrl?: string | null;
  partOfSpeech?: string | null;
  definitions: UnifiedDefinition[];
  synonyms: string[];
  antonyms: string[];
  idioms: UnifiedIdiom[];
}

export interface DictionaryResponse {
  success: boolean;
  data: DictionaryEntry | null;
  source: string | null;
  cached: boolean;
  error: { code: string; message: string } | null;
}

// ─── LanguageTool Grammar Check ───────────────────────────────────────────────

export interface GrammarMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  sentence: string;
  replacements: string[];
  rule: {
    id: string;
    description: string;
    issueType: string;   // "grammar" | "spelling" | "style" | "punctuation" | "typographical"
    category: string;
  };
}

export interface GrammarResponse {
  success: boolean;
  data: {
    language: string;
    languageCode: string;
    matches: GrammarMatch[];
  } | null;
  source: string | null;
  cached: boolean;
  error: { code: string; message: string } | null;
}

// Legacy types kept for compatibility with remaining Free Dictionary shape
export interface Phonetic {
  text?: string;
  audio?: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: { definition: string; example?: string; synonyms: string[]; antonyms: string[] }[];
  synonyms: string[];
  antonyms: string[];
}

// ─── Open-Meteo Geocoding API ─────────────────────────────────────────────────

export interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  timezone: string;
  population?: number;
}

export interface GeocodingResult {
  results?: GeoLocation[];
}

// ─── Open-Meteo Forecast API ──────────────────────────────────────────────────

export interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  precipitation: number;
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyWeather;
  hourly: HourlyWeather;
  timezone: string;
  current_units: Record<string, string>;
}

// ─── REST Countries API ───────────────────────────────────────────────────────

export interface CountryName {
  common: string;
  official: string;
  nativeName?: Record<string, { official: string; common: string }>;
}

export interface CountryFlag {
  png: string;
  svg: string;
  alt?: string;
}

export interface Currency {
  name: string;
  symbol?: string;
}

export interface Country {
  cca2: string;
  cca3: string;
  name: CountryName;
  flags: CountryFlag;
  coatOfArms?: { png?: string; svg?: string };
  region: string;
  subregion?: string;
  population: number;
  capital?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, Currency>;
  borders?: string[];
  timezones?: string[];
  area?: number;
  continents?: string[];
  independent?: boolean;
  unMember?: boolean;
  translations?: Record<string, { official: string; common: string }>;
  maps?: { googleMaps?: string; openStreetMaps?: string };
}
