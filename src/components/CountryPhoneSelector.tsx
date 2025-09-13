import { useState, useEffect, useRef } from 'react'
import { brandColors, typographyPresets } from '../stylings'
import { ChevronDown, Search, Phone } from 'lucide-react'
import countries from 'country-list'
import { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode } from 'libphonenumber-js'
import { getCountryInfo, getCountryFlag, getCountryFlagEmoji, detectUserCountry } from '../lib/countryUtils'

interface CountryData {
  code: string
  name: string
  phoneCode: string
  flag: string
  flagEmoji: string
}

interface CountryPhoneSelectorProps {
  value?: {
    countryCode: string
    phoneNumber: string
  }
  onChange: (value: { 
    countryCode: string
    phoneNumber: string
    isValid: boolean
    countryName?: string
    phonePrefix?: string
    languageCode?: string
    currencyCode?: string
    timezone?: string
  }) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  autoDetectCountry?: boolean
}

export default function CountryPhoneSelector({
  value = { countryCode: '', phoneNumber: '' },
  onChange,
  placeholder = 'Enter phone number',
  disabled = false,
  error,
  required = false,
  autoDetectCountry = true
}: CountryPhoneSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(value.phoneNumber)
  const [isValid, setIsValid] = useState(false)
  const [validationError, setValidationError] = useState('')
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Generate countries data with phone codes
  const countriesData: CountryData[] = countries.getData().map(country => {
    const countryInfo = getCountryInfo(country.code)
    return {
      code: country.code,
      name: country.name,
      phoneCode: countryInfo?.phoneCode || '',
      flag: getCountryFlag(country.code),
      flagEmoji: getCountryFlagEmoji(country.code)
    }
  }).filter(country => country.phoneCode && country.phoneCode.length > 0) // Only include countries with valid phone codes

  // Auto-detect user's country on mount
  useEffect(() => {
    if (autoDetectCountry && !value.countryCode) {
      try {
        const detectedCountryCode = detectUserCountry()
        if (typeof detectedCountryCode === 'string') {
          const detectedCountry = countriesData.find(c => c.code === detectedCountryCode)
          if (detectedCountry) {
            setSelectedCountry(detectedCountry)
            const countryInfo = getCountryInfo(detectedCountryCode)
            onChange({
              countryCode: detectedCountry.code,
              phoneNumber: phoneNumber,
              isValid: false,
              countryName: countryInfo?.name,
              phonePrefix: countryInfo?.phoneCode,
              languageCode: countryInfo?.language,
              currencyCode: countryInfo?.currency,
              timezone: countryInfo?.timezone
            })
          }
        }
      } catch (error) {
        console.warn('Failed to detect user country:', error)
      }
    }
  }, [autoDetectCountry, value.countryCode])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Set initial country from value
  useEffect(() => {
    if (value.countryCode && !selectedCountry) {
      const country = countriesData.find(c => c.code === value.countryCode)
      if (country) {
        setSelectedCountry(country)
      }
    }
  }, [value.countryCode, selectedCountry])

  // Validate phone number when it changes
  useEffect(() => {
    if (phoneNumber && selectedCountry && selectedCountry.phoneCode) {
      try {
        const fullNumber = `+${selectedCountry.phoneCode}${phoneNumber}`
        const isValidNumber = isValidPhoneNumber(fullNumber)
        setIsValid(isValidNumber)
        
        if (phoneNumber && !isValidNumber) {
          setValidationError('Invalid phone number format')
        } else {
          setValidationError('')
        }
      } catch (error) {
        console.warn('Phone validation error:', error)
        setIsValid(false)
        setValidationError('Invalid phone number format')
      }
    } else {
      setIsValid(false)
      setValidationError('')
    }

    // Notify parent component
    if (selectedCountry) {
      const countryInfo = getCountryInfo(selectedCountry.code)
      onChange({
        countryCode: selectedCountry.code,
        phoneNumber: phoneNumber,
        isValid: isValid,
        countryName: countryInfo?.name,
        phonePrefix: countryInfo?.phoneCode,
        languageCode: countryInfo?.language,
        currencyCode: countryInfo?.currency,
        timezone: countryInfo?.timezone
      })
    } else {
      onChange({
        countryCode: '',
        phoneNumber: phoneNumber,
        isValid: false
      })
    }
  }, [phoneNumber, selectedCountry])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isDropdownOpen])

  const detectUserCountry = (): CountryData | null => {
    try {
      // Try to get country from browser locale
      const locale = navigator.language || navigator.languages?.[0]
      const countryCode = locale.split('-')[1]?.toUpperCase()
      
      if (countryCode) {
        const country = countriesData.find(c => c.code === countryCode)
        if (country) return country
      }

      // Fallback to US
      return countriesData.find(c => c.code === 'US') || countriesData[0]
    } catch (error) {
      // Fallback to US
      return countriesData.find(c => c.code === 'US') || countriesData[0]
    }
  }


  const filteredCountries = countriesData.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.phoneCode.includes(searchQuery)
  )

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    setSearchQuery('')
    
    // Immediately notify parent with new country info
    const countryInfo = getCountryInfo(country.code)
    onChange({
      countryCode: country.code,
      phoneNumber: phoneNumber,
      isValid: false, // Will be updated by validation effect
      countryName: countryInfo?.name,
      phonePrefix: countryInfo?.phoneCode,
      languageCode: countryInfo?.language,
      currencyCode: countryInfo?.currency,
      timezone: countryInfo?.timezone
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    setPhoneNumber(value)
  }

  const getDisplayError = () => {
    if (error) return error
    if (validationError) return validationError
    return ''
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Main Input Container */}
      <div style={{
        display: 'flex',
        width: '100%',
        border: `1px solid ${error || validationError ? brandColors.error[300] : brandColors.neutral[300]}`,
        borderRadius: '50px',
        backgroundColor: disabled ? brandColors.neutral[50] : brandColors.white,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}>
        {/* Country Selector */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRight: `1px solid ${brandColors.neutral[200]}`,
              borderRadius: '50px 0 0 50px',
              minWidth: '120px',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedCountry ? (
                <img 
                  src={selectedCountry.flag} 
                  alt={`${selectedCountry.name} flag`}
                  style={{ 
                    width: '20px', 
                    height: '15px', 
                    objectFit: 'cover',
                    borderRadius: '2px'
                  }}
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallbackSpan = document.createElement('span');
                    fallbackSpan.textContent = selectedCountry.flagEmoji;
                    fallbackSpan.style.fontSize = '1.25rem';
                    target.parentNode?.insertBefore(fallbackSpan, target);
                  }}
                />
              ) : (
                <span style={{ fontSize: '1.25rem' }}>🌍</span>
              )}
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '400',
                lineHeight: '1.5',
                letterSpacing: '0',
                fontFamily: 'Poppins, sans-serif',
                color: selectedCountry ? brandColors.neutral[900] : brandColors.neutral[500]
              }}>
                {selectedCountry ? `+${selectedCountry.phoneCode}` : '+1'}
              </span>
            </div>
            <ChevronDown 
              size={16} 
              color={brandColors.neutral[500]}
              style={{
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: isMobile ? '100%' : '400px',
              minWidth: '280px',
              maxWidth: isMobile ? '100vw' : '400px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.neutral[200]}`,
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
              zIndex: 50,
              maxHeight: '400px',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}>
              {/* Search Input */}
              <div style={{
                padding: '0.75rem',
                borderBottom: `1px solid ${brandColors.neutral[200]}`
              }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={16} 
                    color={brandColors.neutral[400]}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: brandColors.neutral[50],
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  />
                </div>
              </div>

              {/* Countries List */}
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: selectedCountry?.code === country.code ? brandColors.primary[50] : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCountry?.code !== country.code) {
                        e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCountry?.code !== country.code) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <img 
                      src={country.flag} 
                      alt={`${country.name} flag`}
                      style={{ 
                        width: '20px', 
                        height: '15px', 
                        objectFit: 'cover',
                        borderRadius: '2px'
                      }}
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackSpan = document.createElement('span');
                        fallbackSpan.textContent = country.flagEmoji;
                        fallbackSpan.style.fontSize = '1.25rem';
                        target.parentNode?.insertBefore(fallbackSpan, target);
                      }}
                    />
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '400',
                        lineHeight: '1.5',
                        letterSpacing: '0',
                        fontFamily: 'Poppins, sans-serif',
                        color: brandColors.neutral[900],
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {country.name}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '400',
                      lineHeight: '1.5',
                      letterSpacing: '0',
                      fontFamily: 'Poppins, sans-serif',
                      color: brandColors.neutral[600],
                      flexShrink: 0
                    }}>
                      +{country.phoneCode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.875rem 3.5rem 0.875rem 0.75rem',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '1rem',
              color: brandColors.neutral[900],
              borderRadius: '0 50px 50px 0',
              // Ensure text doesn't overlap with phone icon on small screens
              boxSizing: 'border-box',
              // Add minimum width to prevent overlap on very small screens
              minWidth: '120px'
            }}
          />
          <Phone 
            size={16} 
            color={brandColors.neutral[400]}
            style={{
              position: 'absolute',
              right: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: phoneNumber ? 0.3 : 1,
              // Ensure icon doesn't interfere with text on small screens
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {getDisplayError() && (
        <div style={{
          marginTop: '0.5rem',
          color: brandColors.error[600],
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>⚠️</span>
          {getDisplayError()}
        </div>
      )}

      {/* Validation Status */}
      {phoneNumber && selectedCountry && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: isValid ? brandColors.success[600] : brandColors.neutral[500],
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>{isValid ? '✅' : '⏳'}</span>
          {isValid ? 'Valid phone number' : 'Enter a valid phone number'}
        </div>
      )}
    </div>
  )
}
