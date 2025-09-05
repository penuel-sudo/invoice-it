// Main styling system export file
// This file exports all styling utilities for consistent use across the invoice app

// Color system
export { brandColors, colorSchemes, componentStyles } from './colors'

// Typography system
export { typography, typographyPresets } from './typography'

// Spacing and layout system
export { 
  spacing, 
  semanticSpacing, 
  borderRadius, 
  shadows, 
  zIndex, 
  breakpoints, 
  containers, 
  grid, 
  flex 
} from './spacing'

// Import for internal use
import { brandColors, colorSchemes, componentStyles } from './colors'
import { typography, typographyPresets } from './typography'
import { 
  spacing, 
  semanticSpacing, 
  borderRadius, 
  shadows, 
  zIndex, 
  breakpoints, 
  containers, 
  grid, 
  flex 
} from './spacing'

// Utility functions for common styling patterns
export const styleUtils = {
  // Create consistent button styles
  createButtonStyle: (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    const baseStyle = {
      ...typographyPresets.button,
      padding: semanticSpacing.button.md,
      borderRadius: borderRadius.md,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.primaryButton.background,
          color: colorSchemes.primaryButton.text,
          '&:hover': {
            backgroundColor: colorSchemes.primaryButton.hover,
          },
        }
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.secondaryButton.background,
          color: colorSchemes.secondaryButton.text,
          border: `1px solid ${colorSchemes.secondaryButton.border}`,
          '&:hover': {
            backgroundColor: colorSchemes.secondaryButton.hover,
          },
        }
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.ghostButton.background,
          color: colorSchemes.ghostButton.text,
          '&:hover': {
            backgroundColor: colorSchemes.ghostButton.hover,
          },
        }
      default:
        return baseStyle
    }
  },

  // Create consistent card styles
  createCardStyle: (variant: 'default' | 'elevated' | 'outlined' = 'default') => {
    const baseStyle = {
      backgroundColor: brandColors.white,
      borderRadius: borderRadius.lg,
      padding: semanticSpacing.layout.card,
    }

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          boxShadow: shadows.lg,
        }
      case 'outlined':
        return {
          ...baseStyle,
          border: `1px solid ${brandColors.neutral[200]}`,
        }
      default:
        return {
          ...baseStyle,
          border: `1px solid ${brandColors.neutral[200]}`,
          boxShadow: shadows.sm,
        }
    }
  },

  // Create consistent input styles
  createInputStyle: (state: 'default' | 'focus' | 'error' | 'disabled' = 'default') => {
    const baseStyle = {
      width: '100%',
      padding: semanticSpacing.input.padding,
      border: `1px solid ${brandColors.neutral[200]}`,
      borderRadius: borderRadius.md,
      fontSize: typographyPresets.body.fontSize,
      color: brandColors.neutral[900],
      backgroundColor: brandColors.white,
      transition: 'border-color 0.2s ease-in-out',
    }

    switch (state) {
      case 'focus':
        return {
          ...baseStyle,
          borderColor: brandColors.primary[500],
          boxShadow: `0 0 0 3px ${brandColors.primary[100]}`,
          outline: 'none',
        }
      case 'error':
        return {
          ...baseStyle,
          borderColor: brandColors.error[500],
          boxShadow: `0 0 0 3px ${brandColors.error[50]}`,
        }
      case 'disabled':
        return {
          ...baseStyle,
          backgroundColor: brandColors.neutral[100],
          color: brandColors.neutral[400],
          cursor: 'not-allowed',
        }
      default:
        return baseStyle
    }
  },

  // Create responsive grid styles
  createGridStyle: (columns: number, gap: keyof typeof semanticSpacing.component = 'md') => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: semanticSpacing.component[gap],
  }),

  // Create flex container styles
  createFlexStyle: (
    direction: 'row' | 'column' = 'row',
    justify: keyof typeof flex.justify = 'start',
    align: keyof typeof flex.align = 'start',
    gap: keyof typeof semanticSpacing.component = 'md'
  ) => ({
    display: 'flex',
    flexDirection: direction === 'column' ? 'column' : 'row',
    justifyContent: flex.justify[justify],
    alignItems: flex.align[align],
    gap: semanticSpacing.component[gap],
  }),

  // Create status badge styles
  createStatusBadgeStyle: (status: 'paid' | 'pending' | 'overdue') => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${spacing[1]} ${spacing[3]}`,
      borderRadius: borderRadius.full,
      fontSize: typographyPresets.caption.fontSize,
      fontWeight: typographyPresets.caption.fontWeight,
      textTransform: 'uppercase' as const,
      letterSpacing: typographyPresets.caption.letterSpacing,
    }

    switch (status) {
      case 'paid':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.status.paidBg,
          color: colorSchemes.status.paid,
        }
      case 'pending':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.status.pendingBg,
          color: colorSchemes.status.pending,
        }
      case 'overdue':
        return {
          ...baseStyle,
          backgroundColor: colorSchemes.status.overdueBg,
          color: colorSchemes.status.overdue,
        }
      default:
        return baseStyle
    }
  },
}

// CSS-in-JS helper for creating style objects
export const createStyles = (styles: Record<string, any>) => styles

// Common style combinations for quick use
export const commonStyles = {
  // Layout containers
  container: {
    maxWidth: containers.xl,
    margin: '0 auto',
    padding: `0 ${semanticSpacing.layout.container}`,
  },
  
  // Page layouts
  page: {
    minHeight: '100vh',
    backgroundColor: brandColors.neutral[50],
    padding: semanticSpacing.layout.page,
  },
  
  // Section spacing
  section: {
    marginBottom: semanticSpacing.layout.section,
  },
  
  // Card layouts
  card: styleUtils.createCardStyle('default'),
  cardElevated: styleUtils.createCardStyle('elevated'),
  cardOutlined: styleUtils.createCardStyle('outlined'),
  
  // Button variants
  buttonPrimary: styleUtils.createButtonStyle('primary'),
  buttonSecondary: styleUtils.createButtonStyle('secondary'),
  buttonGhost: styleUtils.createButtonStyle('ghost'),
  
  // Input states
  inputDefault: styleUtils.createInputStyle('default'),
  inputFocus: styleUtils.createInputStyle('focus'),
  inputError: styleUtils.createInputStyle('error'),
  inputDisabled: styleUtils.createInputStyle('disabled'),
  
  // Flex layouts
  flexRow: styleUtils.createFlexStyle('row', 'start', 'center'),
  flexColumn: styleUtils.createFlexStyle('column', 'start', 'start'),
  flexCenter: styleUtils.createFlexStyle('row', 'center', 'center'),
  flexBetween: styleUtils.createFlexStyle('row', 'between', 'center'),
  
  // Grid layouts
  grid2: styleUtils.createGridStyle(2),
  grid3: styleUtils.createGridStyle(3),
  grid4: styleUtils.createGridStyle(4),
  
  // Status badges
  statusPaid: styleUtils.createStatusBadgeStyle('paid'),
  statusPending: styleUtils.createStatusBadgeStyle('pending'),
  statusOverdue: styleUtils.createStatusBadgeStyle('overdue'),
}

// Export everything for easy importing
export default {
  colors: { brandColors, colorSchemes, componentStyles },
  typography: { typography, typographyPresets },
  spacing: { spacing, semanticSpacing, borderRadius, shadows, zIndex, breakpoints, containers, grid, flex },
  components: {},
  utils: styleUtils,
  common: commonStyles,
}