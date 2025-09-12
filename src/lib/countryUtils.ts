import countries from 'country-list'
import { getCountryCallingCode } from 'libphonenumber-js'

export interface CountryInfo {
  code: string
  name: string
  phoneCode: string
  flag: string
  language: string
  currency: string
  timezone: string
}

// Country to language mapping
const countryLanguageMap: { [key: string]: string } = {
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
  'DE': 'de', 'AT': 'de', 'CH': 'de',
  'FR': 'fr', 'BE': 'fr', 'LU': 'fr', 'MC': 'fr',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CL': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es',
  'IT': 'it', 'SM': 'it', 'VA': 'it',
  'PT': 'pt', 'BR': 'pt',
  'NL': 'nl',
  'RU': 'ru', 'BY': 'ru', 'KZ': 'ru', 'KG': 'ru',
  'CN': 'zh', 'TW': 'zh', 'HK': 'zh', 'SG': 'zh',
  'JP': 'ja',
  'KR': 'ko',
  'BO': 'es', 'CR': 'es', 'CU': 'es',
  'DO': 'es', 'EC': 'es', 'SV': 'es', 'GT': 'es', 'HN': 'es',
  'NI': 'es', 'PA': 'es', 'PY': 'es', 'UY': 'es',
  'EG': 'ar', 'SA': 'ar', 'AE': 'ar', 'JO': 'ar', 'LB': 'ar', 'SY': 'ar',
  'IQ': 'ar', 'KW': 'ar', 'QA': 'ar', 'BH': 'ar', 'OM': 'ar', 'YE': 'ar',
  'IN': 'hi', 'PK': 'ur', 'BD': 'bn', 'LK': 'si', 'NP': 'ne', 'BT': 'dz',
  'TH': 'th', 'LA': 'lo', 'KH': 'km', 'VN': 'vi', 'MY': 'ms', 'ID': 'id',
  'PH': 'tl', 'BN': 'ms', 'MM': 'my', 'TL': 'pt',
  'NG': 'en', 'KE': 'en', 'GH': 'en', 'ZA': 'en', 'TZ': 'en', 'UG': 'en',
  'ET': 'am', 'MA': 'ar', 'TN': 'ar', 'DZ': 'ar', 'LY': 'ar', 'SD': 'ar',
  'TR': 'tr', 'AZ': 'az', 'UZ': 'uz', 'TM': 'tk', 'KY': 'ky',
  'IL': 'he', 'PS': 'ar',
  'PL': 'pl', 'CZ': 'cs', 'SK': 'sk', 'HU': 'hu', 'RO': 'ro', 'BG': 'bg',
  'HR': 'hr', 'SI': 'sl', 'RS': 'sr', 'BA': 'bs', 'ME': 'sr', 'MK': 'mk',
  'AL': 'sq', 'XK': 'sq', 'GR': 'el', 'CY': 'el', 'MT': 'mt',
  'LT': 'lt', 'LV': 'lv', 'EE': 'et', 'FI': 'fi', 'SE': 'sv', 'NO': 'no',
  'DK': 'da', 'IS': 'is', 'FO': 'fo', 'GL': 'kl',
  'AO': 'pt', 'MZ': 'pt', 'CV': 'pt', 'GW': 'pt',
  'ST': 'pt', 'MO': 'pt'
}

// Country to currency mapping
const countryCurrencyMap: { [key: string]: string } = {
  'US': 'USD', 'EC': 'USD', 'SV': 'USD', 'TL': 'USD',
  'GB': 'GBP', 'GG': 'GBP', 'JE': 'GBP', 'IM': 'GBP',
  'EU': 'EUR', 'AD': 'EUR', 'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR',
  'EE': 'EUR', 'FI': 'EUR', 'FR': 'EUR', 'DE': 'EUR', 'GR': 'EUR',
  'IE': 'EUR', 'IT': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR',
  'MT': 'EUR', 'MC': 'EUR', 'NL': 'EUR', 'PT': 'EUR', 'SM': 'EUR',
  'SK': 'EUR', 'SI': 'EUR', 'ES': 'EUR', 'VA': 'EUR',
  'JP': 'JPY',
  'CN': 'CNY', 'HK': 'HKD', 'MO': 'MOP',
  'KR': 'KRW',
  'IN': 'INR', 'BT': 'INR', 'NP': 'NPR', 'PK': 'PKR', 'LK': 'LKR',
  'TH': 'THB', 'LA': 'LAK', 'KH': 'KHR', 'VN': 'VND', 'MY': 'MYR',
  'ID': 'IDR', 'PH': 'PHP', 'SG': 'SGD', 'BN': 'BND', 'MM': 'MMK',
  'AU': 'AUD', 'NZ': 'NZD', 'FJ': 'FJD', 'PG': 'PGK', 'SB': 'SBD',
  'CA': 'CAD',
  'CH': 'CHF', 'LI': 'CHF',
  'SE': 'SEK', 'DK': 'DKK', 'NO': 'NOK', 'IS': 'ISK',
  'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN',
  'HR': 'HRK', 'RS': 'RSD', 'BA': 'BAM', 'ME': 'EUR', 'MK': 'MKD',
  'AL': 'ALL', 'XK': 'EUR',
  'RU': 'RUB', 'BY': 'BYN', 'KZ': 'KZT', 'KG': 'KGS', 'TJ': 'TJS',
  'UZ': 'UZS', 'TM': 'TMT', 'AZ': 'AZN', 'AM': 'AMD', 'GE': 'GEL',
  'TR': 'TRY', 'IL': 'ILS', 'PS': 'ILS', 'JO': 'JOD', 'LB': 'LBP',
  'SY': 'SYP', 'IQ': 'IQD', 'KW': 'KWD', 'QA': 'QAR', 'BH': 'BHD',
  'OM': 'OMR', 'YE': 'YER', 'SA': 'SAR', 'AE': 'AED',
  'EG': 'EGP', 'LY': 'LYD', 'TN': 'TND', 'DZ': 'DZD', 'MA': 'MAD',
  'SD': 'SDG', 'SS': 'SSP', 'ET': 'ETB', 'ER': 'ERN', 'DJ': 'DJF',
  'SO': 'SOS', 'KE': 'KES', 'UG': 'UGX', 'TZ': 'TZS', 'RW': 'RWF',
  'BI': 'BIF', 'MW': 'MWK', 'ZM': 'ZMW', 'ZW': 'ZWL', 'BW': 'BWP',
  'NA': 'NAD', 'ZA': 'ZAR', 'SZ': 'SZL', 'LS': 'LSL', 'MG': 'MGA',
  'MU': 'MUR', 'SC': 'SCR', 'KM': 'KMF', 'YT': 'EUR', 'RE': 'EUR',
  'BR': 'BRL', 'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN',
  'VE': 'VES', 'UY': 'UYU', 'PY': 'PYG', 'BO': 'BOB',
  'GY': 'GYD', 'SR': 'SRD', 'GF': 'EUR', 'FK': 'FKP',
  'MX': 'MXN', 'GT': 'GTQ', 'BZ': 'BZD', 'HN': 'HNL',
  'NI': 'NIO', 'CR': 'CRC', 'PA': 'PAB', 'CU': 'CUP', 'DO': 'DOP',
  'HT': 'HTG', 'JM': 'JMD', 'TT': 'TTD', 'BB': 'BBD', 'AG': 'XCD',
  'DM': 'XCD', 'GD': 'XCD', 'KN': 'XCD', 'LC': 'XCD', 'VC': 'XCD',
  'BS': 'BSD', 'TC': 'USD'
}

// Country to timezone mapping (primary timezone)
const countryTimezoneMap: { [key: string]: string } = {
  'US': 'America/New_York', 'CA': 'America/Toronto', 'MX': 'America/Mexico_City',
  'BR': 'America/Sao_Paulo', 'AR': 'America/Argentina/Buenos_Aires',
  'CL': 'America/Santiago', 'CO': 'America/Bogota', 'PE': 'America/Lima',
  'VE': 'America/Caracas', 'UY': 'America/Montevideo', 'PY': 'America/Asuncion',
  'BO': 'America/La_Paz', 'EC': 'America/Guayaquil', 'GY': 'America/Guyana',
  'SR': 'America/Paramaribo', 'FK': 'Atlantic/Stanley',
  'GT': 'America/Guatemala', 'BZ': 'America/Belize', 'SV': 'America/El_Salvador',
  'HN': 'America/Tegucigalpa', 'NI': 'America/Managua', 'CR': 'America/Costa_Rica',
  'PA': 'America/Panama', 'CU': 'America/Havana', 'DO': 'America/Santo_Domingo',
  'HT': 'America/Port-au-Prince', 'JM': 'America/Jamaica', 'TT': 'America/Port_of_Spain',
  'BB': 'America/Barbados', 'AG': 'America/Antigua', 'DM': 'America/Dominica',
  'GD': 'America/Grenada', 'KN': 'America/St_Kitts', 'LC': 'America/St_Lucia',
  'VC': 'America/St_Vincent', 'BS': 'America/Nassau', 'TC': 'America/Grand_Turk',
  'GB': 'Europe/London', 'IE': 'Europe/Dublin', 'IS': 'Atlantic/Reykjavik',
  'PT': 'Europe/Lisbon', 'ES': 'Europe/Madrid', 'FR': 'Europe/Paris',
  'BE': 'Europe/Brussels', 'NL': 'Europe/Amsterdam', 'LU': 'Europe/Luxembourg',
  'DE': 'Europe/Berlin', 'AT': 'Europe/Vienna', 'CH': 'Europe/Zurich',
  'IT': 'Europe/Rome', 'SM': 'Europe/San_Marino', 'VA': 'Europe/Vatican',
  'MC': 'Europe/Monaco', 'AD': 'Europe/Andorra', 'LI': 'Europe/Vaduz',
  'PL': 'Europe/Warsaw', 'CZ': 'Europe/Prague', 'SK': 'Europe/Bratislava',
  'HU': 'Europe/Budapest', 'SI': 'Europe/Ljubljana', 'HR': 'Europe/Zagreb',
  'BA': 'Europe/Sarajevo', 'RS': 'Europe/Belgrade', 'ME': 'Europe/Podgorica',
  'MK': 'Europe/Skopje', 'AL': 'Europe/Tirana', 'XK': 'Europe/Pristina',
  'GR': 'Europe/Athens', 'CY': 'Asia/Nicosia', 'MT': 'Europe/Malta',
  'RO': 'Europe/Bucharest', 'BG': 'Europe/Sofia', 'TR': 'Europe/Istanbul',
  'RU': 'Europe/Moscow', 'BY': 'Europe/Minsk', 'UA': 'Europe/Kiev',
  'MD': 'Europe/Chisinau', 'LT': 'Europe/Vilnius', 'LV': 'Europe/Riga',
  'EE': 'Europe/Tallinn', 'FI': 'Europe/Helsinki', 'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo', 'DK': 'Europe/Copenhagen', 'FO': 'Atlantic/Faroe',
  'GL': 'America/Godthab', 'SJ': 'Arctic/Longyearbyen',
  'JP': 'Asia/Tokyo', 'KR': 'Asia/Seoul', 'CN': 'Asia/Shanghai',
  'TW': 'Asia/Taipei', 'HK': 'Asia/Hong_Kong', 'MO': 'Asia/Macau',
  'MN': 'Asia/Ulaanbaatar', 'KP': 'Asia/Pyongyang',
  'IN': 'Asia/Kolkata', 'PK': 'Asia/Karachi', 'BD': 'Asia/Dhaka',
  'LK': 'Asia/Colombo', 'NP': 'Asia/Kathmandu', 'BT': 'Asia/Thimphu',
  'MV': 'Indian/Maldives',
  'TH': 'Asia/Bangkok', 'LA': 'Asia/Vientiane', 'KH': 'Asia/Phnom_Penh',
  'VN': 'Asia/Ho_Chi_Minh', 'MY': 'Asia/Kuala_Lumpur', 'SG': 'Asia/Singapore',
  'BN': 'Asia/Brunei', 'ID': 'Asia/Jakarta', 'PH': 'Asia/Manila',
  'MM': 'Asia/Rangoon', 'TL': 'Asia/Dili',
  'AU': 'Australia/Sydney', 'NZ': 'Pacific/Auckland', 'FJ': 'Pacific/Fiji',
  'PG': 'Pacific/Port_Moresby', 'SB': 'Pacific/Guadalcanal', 'VU': 'Pacific/Efate',
  'NC': 'Pacific/Noumea', 'PF': 'Pacific/Tahiti', 'WS': 'Pacific/Apia',
  'TO': 'Pacific/Tongatapu', 'KI': 'Pacific/Tarawa', 'TV': 'Pacific/Funafuti',
  'NR': 'Pacific/Nauru', 'MH': 'Pacific/Majuro', 'FM': 'Pacific/Pohnpei',
  'PW': 'Pacific/Palau', 'CK': 'Pacific/Rarotonga', 'NU': 'Pacific/Niue',
  'TK': 'Pacific/Fakaofo', 'WF': 'Pacific/Wallis', 'AS': 'Pacific/Pago_Pago',
  'GU': 'Pacific/Guam', 'MP': 'Pacific/Saipan', 'VI': 'America/St_Thomas',
  'PR': 'America/Puerto_Rico', 'GP': 'America/Guadeloupe', 'MQ': 'America/Martinique',
  'BL': 'America/St_Barthelemy', 'MF': 'America/Marigot', 'SX': 'America/Lower_Princes',
  'CW': 'America/Curacao', 'AW': 'America/Aruba', 'BQ': 'America/Kralendijk',
  'EG': 'Africa/Cairo', 'LY': 'Africa/Tripoli', 'TN': 'Africa/Tunis',
  'DZ': 'Africa/Algiers', 'MA': 'Africa/Casablanca', 'EH': 'Africa/El_Aaiun',
  'SD': 'Africa/Khartoum', 'SS': 'Africa/Juba', 'ET': 'Africa/Addis_Ababa',
  'ER': 'Africa/Asmara', 'DJ': 'Africa/Djibouti', 'SO': 'Africa/Mogadishu',
  'KE': 'Africa/Nairobi', 'UG': 'Africa/Kampala', 'TZ': 'Africa/Dar_es_Salaam',
  'RW': 'Africa/Kigali', 'BI': 'Africa/Bujumbura', 'MW': 'Africa/Blantyre',
  'ZM': 'Africa/Lusaka', 'ZW': 'Africa/Harare', 'BW': 'Africa/Gaborone',
  'NA': 'Africa/Windhoek', 'ZA': 'Africa/Johannesburg', 'SZ': 'Africa/Mbabane',
  'LS': 'Africa/Maseru', 'MG': 'Indian/Antananarivo', 'MU': 'Indian/Mauritius',
  'SC': 'Indian/Mahe', 'KM': 'Indian/Comoro', 'YT': 'Indian/Mayotte',
  'RE': 'Indian/Reunion', 'MZ': 'Africa/Maputo', 'AO': 'Africa/Luanda',
  'CD': 'Africa/Kinshasa', 'CG': 'Africa/Brazzaville', 'CF': 'Africa/Bangui',
  'TD': 'Africa/Ndjamena', 'CM': 'Africa/Douala', 'GQ': 'Africa/Malabo',
  'GA': 'Africa/Libreville', 'ST': 'Africa/Sao_Tome', 'GH': 'Africa/Accra',
  'TG': 'Africa/Lome', 'BJ': 'Africa/Porto-Novo', 'BF': 'Africa/Ouagadougou',
  'ML': 'Africa/Bamako', 'NE': 'Africa/Niamey', 'NG': 'Africa/Lagos',
  'SN': 'Africa/Dakar', 'GM': 'Africa/Banjul', 'GN': 'Africa/Conakry',
  'GW': 'Africa/Bissau', 'SL': 'Africa/Freetown', 'LR': 'Africa/Monrovia',
  'CI': 'Africa/Abidjan', 'IL': 'Asia/Jerusalem', 'PS': 'Asia/Gaza',
  'JO': 'Asia/Amman', 'LB': 'Asia/Beirut', 'SY': 'Asia/Damascus',
  'IQ': 'Asia/Baghdad', 'KW': 'Asia/Kuwait', 'QA': 'Asia/Qatar',
  'BH': 'Asia/Bahrain', 'OM': 'Asia/Muscat', 'YE': 'Asia/Aden',
  'SA': 'Asia/Riyadh', 'AE': 'Asia/Dubai'
}

export function getCountryInfo(countryCode: string): CountryInfo | null {
  const country = countries.getData().find(c => c.code === countryCode)
  if (!country) return null

  let phoneCode = ''
  try {
    phoneCode = getCountryCallingCode(countryCode as any) || ''
  } catch (error) {
    // Handle unknown country codes (like AQ - Antarctica)
    console.warn(`Unknown country code: ${countryCode}`)
    phoneCode = ''
  }

  const language = countryLanguageMap[countryCode] || 'en'
  const currency = countryCurrencyMap[countryCode] || 'USD'
  const timezone = countryTimezoneMap[countryCode] || 'UTC'

  return {
    code: country.code,
    name: country.name,
    phoneCode,
    flag: getCountryFlag(country.code),
    language,
    currency,
    timezone
  }
}

export function getCountryFlag(countryCode: string): string {
  // Return actual flag image URL using flagsapi.com CDN
  // This service provides high-quality SVG flag images
  return `https://flagsapi.com/${countryCode}/flat/64.png`
}

export function getCountryFlagEmoji(countryCode: string): string {
  // Fallback emoji mapping for cases where images might not load
  const flagMap: { [key: string]: string } = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪',
    'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹',
    'BE': '🇧🇪', 'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷', 'PL': '🇵🇱',
    'CZ': '🇨🇿', 'HU': '🇭🇺', 'SK': '🇸🇰', 'SI': '🇸🇮', 'HR': '🇭🇷',
    'RO': '🇷🇴', 'BG': '🇧🇬', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪',
    'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳', 'SG': '🇸🇬',
    'MY': '🇲🇾', 'TH': '🇹🇭', 'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳',
    'BR': '🇧🇷', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴',
    'PE': '🇵🇪', 'VE': '🇻🇪', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬',
    'KE': '🇰🇪', 'GH': '🇬🇭', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿',
    'RU': '🇷🇺', 'UA': '🇺🇦', 'TR': '🇹🇷', 'IL': '🇮🇱', 'AE': '🇦🇪',
    'SA': '🇸🇦', 'KW': '🇰🇼', 'QA': '🇶🇦', 'BH': '🇧🇭', 'OM': '🇴🇲'
  }
  return flagMap[countryCode] || '🌍'
}

export function detectUserCountry(): string {
  try {
    // Try to get country from browser locale
    const locale = navigator.language || navigator.languages?.[0]
    const countryCode = locale.split('-')[1]?.toUpperCase()
    
    if (countryCode) {
      const country = countries.getData().find(c => c.code === countryCode)
      if (country) return countryCode
    }

    // Fallback to US
    return 'US'
  } catch (error) {
    // Fallback to US
    return 'US'
  }
}
