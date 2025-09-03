export const typography = {
  // Font families
  fonts: {
    // Primary font - Professional and readable
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Secondary font - For headings and emphasis
    secondary: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Monospace font - For numbers, codes, and technical content
    mono: 'JetBrains Mono, "Fira Code", "Roboto Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  
  // Font sizes
  sizes: {
    xs: '0.75rem',      // 12px - Small labels, captions
    sm: '0.875rem',     // 14px - Body text, secondary info
    base: '1rem',       // 16px - Default body text
    lg: '1.125rem',     // 18px - Large body text
    xl: '1.25rem',      // 20px - Subheadings
    '2xl': '1.5rem',    // 24px - Section headings
    '3xl': '1.875rem',  // 30px - Page headings
    '4xl': '2.25rem',   // 36px - Large headings
    '5xl': '3rem',      // 48px - Hero headings
  },
  
  // Font weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line heights
  lineHeights: {
    tight: '1.25',      // For headings
    normal: '1.5',      // For body text
    relaxed: '1.75',    // For long paragraphs
  },
  
  // Letter spacing
  letterSpacing: {
    tight: '-0.025em',  // For headings
    normal: '0em',      // Default
    wide: '0.025em',    // For emphasis
  },
}

// Typography combinations for different UI elements
export const textStyles = {
  // Invoice title
  invoiceTitle: {
    fontFamily: typography.fonts.secondary,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  // Section headings
  sectionHeading: {
    fontFamily: typography.fonts.secondary,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.tight,
  },
  
  // Body text
  body: {
    fontFamily: typography.fonts.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
  },
  
  // Button text
  button: {
    fontFamily: typography.fonts.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // Numbers and amounts
  numbers: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  
  // Small labels
  label: {
    fontFamily: typography.fonts.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacing.wide,
  },
}
