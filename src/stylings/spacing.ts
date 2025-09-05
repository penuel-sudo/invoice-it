// Spacing system for consistent layouts
export const spacing = {
  // Base spacing scale (4px increments)
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',   // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
}

// Semantic spacing for common use cases
export const semanticSpacing = {
  // Component spacing
  component: {
    xs: spacing[1],    // 4px - tight spacing
    sm: spacing[2],    // 8px - small spacing
    md: spacing[4],    // 16px - medium spacing
    lg: spacing[6],    // 24px - large spacing
    xl: spacing[8],    // 32px - extra large spacing
    '2xl': spacing[12], // 48px - 2x large spacing
    '3xl': spacing[16], // 64px - 3x large spacing
  },

  // Layout spacing
  layout: {
    container: spacing[6],     // 24px - container padding
    section: spacing[12],      // 48px - section spacing
    page: spacing[8],          // 32px - page padding
    card: spacing[6],          // 24px - card padding
    form: spacing[4],          // 16px - form spacing
  },

  // Invoice specific spacing
  invoice: {
    header: spacing[8],        // 32px - invoice header spacing
    section: spacing[6],       // 24px - invoice section spacing
    item: spacing[4],          // 16px - invoice item spacing
    total: spacing[8],         // 32px - total section spacing
    footer: spacing[6],        // 24px - invoice footer spacing
    table: spacing[3],         // 12px - table cell spacing
  },

  // Button spacing
  button: {
    sm: `${spacing[2]} ${spacing[3]}`,  // 8px 12px
    md: `${spacing[3]} ${spacing[4]}`,  // 12px 16px
    lg: `${spacing[4]} ${spacing[6]}`,  // 16px 24px
    xl: `${spacing[5]} ${spacing[8]}`,  // 20px 32px
  },

  // Input spacing
  input: {
    padding: `${spacing[3]} ${spacing[4]}`,  // 12px 16px
    gap: spacing[2],                         // 8px
  },
}

// Border radius system
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
}

// Shadow system
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}

// Z-index system
export const zIndex = {
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
}

// Breakpoints for responsive design
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Container sizes
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
  full: '100%',
}

// Grid system
export const grid = {
  columns: 12,
  gap: {
    sm: spacing[2],  // 8px
    md: spacing[4],  // 16px
    lg: spacing[6],  // 24px
    xl: spacing[8],  // 32px
  },
}

// Flexbox utilities
export const flex = {
  direction: {
    row: 'row',
    'row-reverse': 'row-reverse',
    col: 'column',
    'col-reverse': 'column-reverse',
  },
  wrap: {
    nowrap: 'nowrap',
    wrap: 'wrap',
    'wrap-reverse': 'wrap-reverse',
  },
  justify: {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  },
  align: {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    baseline: 'baseline',
    stretch: 'stretch',
  },
}
