// Typography system for Invoice App
export const typography = {
  // Font families - Clean, modern iOS-style fonts
  fontFamily: {
    sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
    display: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
    heading: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
    body: ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
  },

  // Font sizes - Perfect for invoice documents
  fontSize: {
    // Display sizes - for headers and important sections
    'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 72px
    'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],  // 60px
    'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],     // 48px
    'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],  // 36px
    'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 30px
    'display-xs': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0' }],         // 24px

    // Text sizes - for body content
    'text-xl': ['1.25rem', { lineHeight: '1.75', letterSpacing: '0' }],          // 20px
    'text-lg': ['1.125rem', { lineHeight: '1.75', letterSpacing: '0' }],         // 18px
    'text-base': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],            // 16px
    'text-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],          // 14px
    'text-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],           // 12px

    // Invoice specific sizes
    'invoice-title': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],  // 32px
    'invoice-subtitle': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0' }],   // 24px
    'invoice-section': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0' }],  // 18px
    'invoice-body': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0' }],     // 14px
    'invoice-small': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0' }],     // 12px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
}

// Typography presets for common invoice elements
export const typographyPresets = {
  // Headers
  h1: {
    fontSize: typography.fontSize['display-lg'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: typography.fontFamily.heading,
  },
  h2: {
    fontSize: typography.fontSize['display-md'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: typography.fontFamily.heading,
  },
  h3: {
    fontSize: typography.fontSize['display-sm'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.heading,
  },
  h4: {
    fontSize: typography.fontSize['display-xs'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.heading,
  },

  // Body text
  body: {
    fontSize: typography.fontSize['text-base'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.body,
  },
  bodyLarge: {
    fontSize: typography.fontSize['text-lg'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.body,
  },
  bodySmall: {
    fontSize: typography.fontSize['text-sm'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.body,
  },

  // Invoice specific
  invoiceTitle: {
    fontSize: typography.fontSize['invoice-title'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  invoiceSubtitle: {
    fontSize: typography.fontSize['invoice-subtitle'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  invoiceSection: {
    fontSize: typography.fontSize['invoice-section'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  invoiceBody: {
    fontSize: typography.fontSize['invoice-body'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  invoiceSmall: {
    fontSize: typography.fontSize['invoice-small'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Labels and captions
  label: {
    fontSize: typography.fontSize['text-sm'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    fontSize: typography.fontSize['text-xs'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Buttons
  button: {
    fontSize: typography.fontSize['text-sm'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.none,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: typography.fontFamily.body,
  },
  buttonLarge: {
    fontSize: typography.fontSize['text-base'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.none,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: typography.fontFamily.body,
  },
  buttonSmall: {
    fontSize: typography.fontSize['text-xs'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.none,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: typography.fontFamily.body,
  },

  // Code and monospace
  code: {
    fontSize: typography.fontSize['text-sm'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.mono,
  },
  codeSmall: {
    fontSize: typography.fontSize['text-xs'],
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: typography.fontFamily.mono,
  },
}
