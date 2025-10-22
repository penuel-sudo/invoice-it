import React, { useState, useEffect } from 'react'

interface FormattedNumberInputProps {
  value: number
  onChange: (value: number, formattedValue: string) => void
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
 * - Text input with comma formatting (e.g., "1,234.56")
 * - Flexible user input parsing (handles commas, decimals)
 * - Returns both formatted string and parsed number
 * - No interference with data flow
 * - Consistent behavior across all templates
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

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(formatNumberWithCommas(value))
  }, [value])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow only numbers, commas, and decimal points
    const sanitized = inputValue.replace(/[^0-9,.]/g, '')
    
    // Prevent multiple decimal points
    const parts = sanitized.split('.')
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
    
    setDisplayValue(finalValue)
    
    // Parse and validate the number
    const parsedNumber = parseFormattedNumber(finalValue)
    
    // Apply min/max constraints
    let constrainedNumber = parsedNumber
    if (min !== undefined && parsedNumber < min) {
      constrainedNumber = min
    }
    if (max !== undefined && parsedNumber > max) {
      constrainedNumber = max
    }
    
    // Call onChange with both parsed number and formatted string
    onChange(constrainedNumber, formatNumberWithCommas(constrainedNumber))
  }

  // Handle blur - format the display value
  const handleBlur = () => {
    const parsedNumber = parseFormattedNumber(displayValue)
    const formatted = formatNumberWithCommas(parsedNumber)
    setDisplayValue(formatted)
  }

  // Handle focus - show raw number for easier editing
  const handleFocus = () => {
    const parsedNumber = parseFormattedNumber(displayValue)
    setDisplayValue(parsedNumber.toString())
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

