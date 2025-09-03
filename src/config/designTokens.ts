import { brandColors, colorSchemes } from './colors'
import { typography, textStyles } from './typography'

export const designTokens = {
  colors: brandColors,
  colorSchemes,
  typography,
  textStyles,
  
  // Spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
}

// Common component styles
export const componentStyles = {
  // Button variants
  button: {
    primary: {
      backgroundColor: brandColors.primary[600],
      color: brandColors.white,
      border: `1px solid ${brandColors.primary[600]}`,
      borderRadius: designTokens.borderRadius.lg,
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      transition: designTokens.transitions.fast,
      '&:hover': {
        backgroundColor: brandColors.primary[700],
        borderColor: brandColors.primary[700],
      },
    },
    secondary: {
      backgroundColor: brandColors.white,
      color: brandColors.primary[600],
      border: `1px solid ${brandColors.primary[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      transition: designTokens.transitions.fast,
      '&:hover': {
        backgroundColor: brandColors.neutral[50],
        borderColor: brandColors.primary[300],
      },
    },
  },
  
  // Card styles
  card: {
    base: {
      backgroundColor: brandColors.white,
      border: `1px solid ${brandColors.neutral[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.shadows.base,
      padding: designTokens.spacing[6],
    },
    elevated: {
      backgroundColor: brandColors.white,
      border: `1px solid ${brandColors.neutral[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.shadows.lg,
      padding: designTokens.spacing[6],
    },
  },
  
  // Input styles
  input: {
    base: {
      border: `1px solid ${brandColors.neutral[300]}`,
      borderRadius: designTokens.borderRadius.md,
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: typography.sizes.base,
      fontFamily: typography.fonts.primary,
      transition: designTokens.transitions.fast,
      '&:focus': {
        outline: 'none',
        borderColor: brandColors.primary[500],
        boxShadow: `0 0 0 3px ${brandColors.primary[100]}`,
      },
    },
  },
}
