/**
 * Currency Conversion Service
 * Hybrid approach: Cached rates with periodic updates
 * Uses ExchangeRate-API (free tier: 1,500 requests/month)
 */

import { supabase } from './supabaseClient'

export interface ExchangeRate {
  base_currency: string
  target_currency: string
  rate: number
  updated_at: string
}

// Cache rates in memory for the session
const rateCache: Map<string, { rate: number; timestamp: number }> = new Map()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Get exchange rate from cache or fetch from API
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1
  }

  const cacheKey = `${fromCurrency}_${toCurrency}`
  const cached = rateCache.get(cacheKey)

  // Check if cached rate is still valid (less than 24 hours old)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }

  try {
    // Try to get from database cache first
    const { data: dbRate } = await supabase
      .from('currency_rates')
      .select('rate, updated_at')
      .eq('base_currency', fromCurrency)
      .eq('target_currency', toCurrency)
      .single()

    // Check if database rate is recent (less than 24 hours old)
    if (dbRate?.rate && dbRate?.updated_at) {
      const dbTimestamp = new Date(dbRate.updated_at).getTime()
      if (Date.now() - dbTimestamp < CACHE_DURATION) {
        // Cache in memory
        rateCache.set(cacheKey, {
          rate: dbRate.rate,
          timestamp: Date.now()
        })
        return dbRate.rate
      }
    }

    // Fetch from API
    const rate = await fetchExchangeRateFromAPI(fromCurrency, toCurrency)

    // Save to database cache
    await supabase
      .from('currency_rates')
      .upsert({
        base_currency: fromCurrency,
        target_currency: toCurrency,
        rate: rate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'base_currency,target_currency'
      })

    // Cache in memory
    rateCache.set(cacheKey, {
      rate: rate,
      timestamp: Date.now()
    })

    return rate
  } catch (error) {
    console.error('Error getting exchange rate:', error)
    
    // Fallback: Try reverse rate if available
    const reverseKey = `${toCurrency}_${fromCurrency}`
    const reverseCached = rateCache.get(reverseKey)
    if (reverseCached) {
      return 1 / reverseCached.rate
    }

    // Last resort: return 1 (no conversion) and log warning
    console.warn(`Could not get exchange rate for ${fromCurrency} to ${toCurrency}, using 1.0`)
    return 1
  }
}

/**
 * Fetch exchange rate from ExchangeRate-API
 * Free tier: https://www.exchangerate-api.com/
 * Alternative: Use fixer.io, currencyapi.net, or exchangerate.host
 */
async function fetchExchangeRateFromAPI(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // Using exchangerate-api.com (free, no API key needed for basic usage)
    // Alternative: Use your own API key for higher limits
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    )

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const rate = data.rates?.[toCurrency]

    if (!rate) {
      throw new Error(`Rate not found for ${toCurrency}`)
    }

    return rate
  } catch (error) {
    console.error('Error fetching from ExchangeRate-API:', error)
    
    // Fallback: Try alternative free API (exchangerate.host)
    try {
      const fallbackResponse = await fetch(
        `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`
      )
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        return fallbackData.rates?.[toCurrency] || 1
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError)
    }

    throw error
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency)
  return amount * rate
}

/**
 * Convert multiple amounts to a target currency
 * Useful for summing invoices/expenses in different currencies
 */
export async function convertAmountsToCurrency(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<number> {
  const conversions = await Promise.all(
    amounts.map(async ({ amount, currency }) => {
      return await convertCurrency(amount, currency, targetCurrency)
    })
  )

  return conversions.reduce((sum, converted) => sum + converted, 0)
}

/**
 * Batch convert - more efficient for multiple conversions
 */
export async function batchConvert(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<number> {
  // Handle empty array
  if (!amounts || amounts.length === 0) {
    return 0
  }

  // Group by currency to minimize API calls
  const currencyGroups: Record<string, number> = {}
  
  amounts.forEach(({ amount, currency }) => {
    const currencyCode = currency || targetCurrency // Fallback to target if missing
    if (currencyCode === targetCurrency) {
      currencyGroups[targetCurrency] = (currencyGroups[targetCurrency] || 0) + amount
    } else {
      currencyGroups[currencyCode] = (currencyGroups[currencyCode] || 0) + amount
    }
  })

  // Convert each unique currency group
  const conversions = await Promise.all(
    Object.entries(currencyGroups).map(async ([currency, totalAmount]) => {
      if (currency === targetCurrency) {
        return totalAmount
      }
      try {
        const rate = await getExchangeRate(currency, targetCurrency)
        console.log(`Converting ${totalAmount} ${currency} to ${targetCurrency} at rate ${rate}`)
        return totalAmount * rate
      } catch (error) {
        console.error(`Error converting ${currency} to ${targetCurrency}:`, error)
        // Return amount as-is if conversion fails
        return totalAmount
      }
    })
  )

  const total = conversions.reduce((sum, converted) => sum + converted, 0)
  console.log(`Batch conversion result: ${total} ${targetCurrency}`)
  return total
}

