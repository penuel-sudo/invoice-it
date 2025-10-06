import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabaseClient'
import { getCurrencySymbol } from '../lib/currencyUtils'

interface CurrencyData {
  currency: string
  currencySymbol: string
  isLoading: boolean
}

export function useGlobalCurrency(): CurrencyData {
  const { user } = useAuth()
  const [currencyData, setCurrencyData] = useState<CurrencyData>({
    currency: 'USD',
    currencySymbol: '$',
    isLoading: true
  })

  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (!user?.id) {
        setCurrencyData({
          currency: 'USD',
          currencySymbol: '$',
          isLoading: false
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('currency_code')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user currency:', error)
          setCurrencyData({
            currency: 'USD',
            currencySymbol: '$',
            isLoading: false
          })
          return
        }

        const currencyCode = data?.currency_code || 'USD'
        const currencySymbol = getCurrencySymbol(currencyCode)

        setCurrencyData({
          currency: currencyCode,
          currencySymbol: currencySymbol,
          isLoading: false
        })
      } catch (error) {
        console.error('Error fetching user currency:', error)
        setCurrencyData({
          currency: 'USD',
          currencySymbol: '$',
          isLoading: false
        })
      }
    }

    fetchUserCurrency()
  }, [user])

  return currencyData
}
