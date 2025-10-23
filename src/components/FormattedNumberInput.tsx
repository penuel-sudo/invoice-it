import React, { useState, useEffect } from 'react'

interface FormattedNumberInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  style?: React.CSSProperties
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  className?: string
  id?: string
  name?: string
}

/**
 * Reusable Formatted Number Input Component
 * 
 * Features:
 * - FREE TYPING: Allows unrestricted input while typing
 * - FORMAT ON BLUR: Only formats when user leaves the field
 * - COMMA SEPARATION: Adds commas for display (1,234.56)
 * - DECIMAL SUPPORT: Handles any decimal places
 * - NO INTERFERENCE: Doesn't interrupt user input flow
 * - CALCULATION READY: Returns parsed number for calculations
 */
export default function FormattedNumberInput({
  value,
  onChange,
  placeholder = "0.00",
  style,
  disabled = false,
  min,
  max,
  step = 0.01,
  className,
  id,
  name
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [hasUserTyped, setHasUserTyped] = useState(false)

  // Format number with commas for display
  const formatNumberWithCommas = (num: number): string => {
    if (isNaN(num) || num === null || num === undefined) return ''
    
    // Round to 2 decimal places
    const rounded = Math.round(num * 100) / 100
    
    // Split by decimal point
    const parts = rounded.toString().split('.')
    
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Join back with decimal if it exists
    return parts.join('.')
  }

  // Parse formatted string back to number
  const parseFormattedNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0
    
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    
    return isNaN(parsed) ? 0 : parsed
  }

  // Update display value when prop value changes (only when not focused)
  useEffect(() => {
    if (!isFocused && !hasUserTyped) {
      // Only show formatted value if user hasn't typed yet
      if (value === 0) {
        setDisplayValue('')  // Don't show 0.00 initially
      } else {
        setDisplayValue(formatNumberWithCommas(value))
      }
    }
  }, [value, isFocused, hasUserTyped])

  // Handle input change - allow free typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Mark that user has started typing
    setHasUserTyped(true)
    
    // Allow only numbers, decimal points, and basic characters
    // Don't restrict too much while typing
    const sanitized = inputValue.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = sanitized.split('.')
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
    
    setDisplayValue(finalValue)
    
    // Parse the number for internal calculation
    const parsedNumber = parseFormattedNumber(finalValue)
    
    // Apply min/max constraints
    let constrainedNumber = parsedNumber
    if (min !== undefined && parsedNumber < min) {
      constrainedNumber = min
    }
    if (max !== undefined && parsedNumber > max) {
      constrainedNumber = max
    }
    
    // Call onChange with the parsed number (for calculations)
    onChange(constrainedNumber)
  }

  // Handle blur - format the display value and finalize
  const handleBlur = () => {
    setIsFocused(false)
    const parsedNumber = parseFormattedNumber(displayValue)
    const formatted = formatNumberWithCommas(parsedNumber)
    setDisplayValue(formatted)
    
    // Reset user typing flag for next interaction
    setHasUserTyped(false)
    
    // Final onChange call with parsed number
    onChange(parsedNumber)
  }

  // Handle focus - show raw number for easier editing
  const handleFocus = () => {
    setIsFocused(true)
    
    // If the field shows 0.00 or empty, clear it for user to type
    if (displayValue === '0.00' || displayValue === '' || displayValue === '0') {
      setDisplayValue('')
    } else {
      const parsedNumber = parseFormattedNumber(displayValue)
      setDisplayValue(parsedNumber.toString())
    }
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      className={className}
      id={id}
      name={name}
    />
  )
}

