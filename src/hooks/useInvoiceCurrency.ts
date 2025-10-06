import { useState, useEffect } from 'react'
import { useGlobalCurrency } from './useGlobalCurrency'
import { getCurrencySymbol } from '../lib/currencyUtils'

interface InvoiceCurrencyData {
  currency: string
  currencySymbol: string
  isLoading: boolean
  setCurrency: (currency: string) => void
}

export function useInvoiceCurrency(initialCurrency?: string): InvoiceCurrencyData {
  const globalCurrency = useGlobalCurrency()
  const [invoiceCurrency, setInvoiceCurrency] = useState<string | null>(null)

  // Use initial currency if provided, otherwise use global default
  const currentCurrency = invoiceCurrency || initialCurrency || globalCurrency.currency
  const currentSymbol = getCurrencySymbol(currentCurrency)

  const setCurrency = (currency: string) => {
    setInvoiceCurrency(currency)
  }

  return {
    currency: currentCurrency,
    currencySymbol: currentSymbol,
    isLoading: globalCurrency.isLoading,
    setCurrency
  }
}
