/**
 * Country Data Cache Service
 * Loads country data once when user logs in and caches it for all components
 */

import countries from 'country-list'
import { getCountryInfo, getCountryFlag, getCountryFlagEmoji } from './countryUtils'

export interface CachedCountryData {
  code: string
  name: string
  phoneCode: string
  flag: string
  flagEmoji: string
}

let cachedCountriesData: CachedCountryData[] | null = null
let isInitialized = false

/**
 * Initialize country data cache
 * Call this when user logs in
 */
export function initializeCountryCache(): void {
  if (isInitialized && cachedCountriesData) {
    return // Already initialized
  }

  try {
    cachedCountriesData = countries.getData().map(country => {
      const countryInfo = getCountryInfo(country.code)
      return {
        code: country.code,
        name: country.name,
        phoneCode: countryInfo?.phoneCode || '',
        flag: getCountryFlag(country.code),
        flagEmoji: getCountryFlagEmoji(country.code)
      }
    }).filter(country => country.phoneCode && country.phoneCode.length > 0)

    isInitialized = true
    console.log(`Country cache initialized with ${cachedCountriesData.length} countries`)
  } catch (error) {
    console.error('Error initializing country cache:', error)
    cachedCountriesData = []
  }
}

/**
 * Get cached country data
 * Returns cached data if available, otherwise initializes and returns
 */
export function getCachedCountriesData(): CachedCountryData[] {
  if (!cachedCountriesData) {
    initializeCountryCache()
  }
  return cachedCountriesData || []
}

/**
 * Clear country cache (useful for testing or logout)
 */
export function clearCountryCache(): void {
  cachedCountriesData = null
  isInitialized = false
}

/**
 * Check if cache is initialized
 */
export function isCountryCacheInitialized(): boolean {
  return isInitialized && cachedCountriesData !== null
}

