import type { Config } from "@/components/SettingsPage";

/**
 * Loads the RepoPulse config from localStorage.
 * @returns {Config | null} The parsed config object, or null if not found or invalid.
 */
export function loadConfigFromLocalStorage(): Config | null {
  const localConfig = localStorage.getItem('repopulse-config');
  if (!localConfig) return null;
  try {
    return JSON.parse(localConfig) as Config;
  } catch {
    return null;
  }
} 