export const brandColors = {
  // Primary Green - Your main brand color (matching the image)
  primary: {
    50: '#f0fdf4',   // Very light green - subtle backgrounds
    100: '#dcfce7',  // Light green - hover states
    200: '#bbf7d0',  // Light green - borders/dividers
    300: '#86efac',  // Medium green - secondary elements
    400: '#4ade80',  // Medium green - icons/accents
    500: '#22c55e',  // Main brand green - primary actions
    600: '#16a34a',  // Darker green - primary buttons (main brand)
    700: '#15803d',  // Dark green - hover states
    800: '#166534',  // Darker green - headings
    900: '#14532d',  // Darkest green - strong emphasis
  },
  
  // Neutral Grays - Minimal supporting colors
  neutral: {
    50: '#f8fafc',   // Off-white - main backgrounds
    100: '#f1f5f9',  // Very light gray - card backgrounds
    200: '#e2e8f0',  // Light gray - borders
    300: '#cbd5e1',  // Medium gray - dividers
    400: '#94a3b8',  // Medium gray - secondary text
    500: '#64748b',  // Gray - body text
    600: '#475569',  // Dark gray - headings
    700: '#334155',  // Darker gray - strong headings
    800: '#1e293b',  // Very dark gray - primary text
    900: '#0f172a',  // Almost black - emphasis text
  },
  
  // White variations
  white: '#ffffff',
  'white-soft': '#fefefe',
  'white-warm': '#fcfcfd',
  
  // Minimal semantic colors (very subtle)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',  // Light green
    200: '#bbf7d0',  // Light green
    300: '#86efac',  // Medium green
    400: '#4ade80',  // Medium green
    500: '#10b981',  // Muted green
    600: '#059669',  // Dark green
    700: '#047857',  // Darker green
    800: '#065f46',  // Dark green
    900: '#064e3b',  // Darkest green
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',  // Light orange
    200: '#fde68a',  // Light orange
    300: '#fcd34d',  // Medium orange
    400: '#fbbf24',  // Medium orange
    500: '#f59e0b',  // Muted orange
    600: '#d97706',  // Dark orange
    700: '#b45309',  // Darker orange
    800: '#92400e',  // Dark orange
    900: '#78350f',  // Darkest orange
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444', // Muted red
    600: '#dc2626',
  },
}

// Simplified color combinations focusing on green and white
export const colorSchemes = {
  // Primary button - Clean green
  primaryButton: {
    background: brandColors.primary[600],
    hover: brandColors.primary[700],
    text: brandColors.white,
    border: brandColors.primary[600],
  },
  
  // Secondary button - White with green accent
  secondaryButton: {
    background: brandColors.white,
    hover: brandColors.primary[50],
    text: brandColors.primary[600],
    border: brandColors.primary[200],
  },
  
  // Ghost button - Minimal
  ghostButton: {
    background: 'transparent',
    hover: brandColors.primary[50],
    text: brandColors.primary[600],
    border: 'transparent',
  },
  
  // Card design - Clean white
  card: {
    background: brandColors.white,
    border: brandColors.neutral[200],
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  
  // Header - Clean green
  header: {
    background: brandColors.primary[600],
    text: brandColors.white,
    accent: brandColors.primary[400],
  },
  
  // Navigation - Minimal
  navigation: {
    background: brandColors.white,
    active: brandColors.primary[600],
    inactive: brandColors.neutral[500],
    hover: brandColors.primary[50],
  },
  
  // Dashboard - Clean and minimal
  dashboard: {
    background: brandColors.neutral[50],
    cardBackground: brandColors.white,
    primary: brandColors.primary[600],
    secondary: brandColors.neutral[600],
  },
  
  // Status indicators - Very subtle
  status: {
    paid: brandColors.success[500],
    pending: brandColors.warning[500],
    overdue: brandColors.error[500],
    // Background variants
    paidBg: brandColors.success[50],
    pendingBg: brandColors.warning[50],
    overdueBg: brandColors.error[50],
  },
  
  // Text colors - Simple hierarchy
  text: {
    primary: brandColors.neutral[900],   // Main text
    secondary: brandColors.neutral[600], // Secondary text
    tertiary: brandColors.neutral[500],  // Muted text
    accent: brandColors.primary[600],    // Brand accent text
    inverse: brandColors.white,          // White text on dark backgrounds
  },
  
  // Border colors - Minimal
  border: {
    light: brandColors.neutral[200],     // Light borders
    medium: brandColors.neutral[300],    // Medium borders
    dark: brandColors.neutral[400],      // Darker borders
    accent: brandColors.primary[200],    // Blue accent borders
  },
  
  // Background colors - Clean palette
  background: {
    primary: brandColors.white,          // Main background
    secondary: brandColors.neutral[50],  // Secondary background
    tertiary: brandColors.neutral[100],  // Tertiary background
    accent: brandColors.primary[50],     // Blue accent background
  }
}

// Usage examples for different components
export const componentStyles = {
  // Input fields
  input: {
    background: brandColors.white,
    border: brandColors.neutral[200],
    focusBorder: brandColors.primary[500],
    text: brandColors.neutral[900],
    placeholder: brandColors.neutral[400],
  },
  
  // Tables
  table: {
    headerBg: brandColors.neutral[50],
    headerText: brandColors.neutral[700],
    rowBorder: brandColors.neutral[200],
    evenRowBg: brandColors.white,
    oddRowBg: brandColors.white,
  },
  
  // Sidebar
  sidebar: {
    background: brandColors.white,
    border: brandColors.neutral[200],
    activeItem: brandColors.primary[50],
    activeText: brandColors.primary[700],
    inactiveText: brandColors.neutral[600],
  },
  
  // Modals/Overlays
  modal: {
    background: brandColors.white,
    overlay: 'rgba(15, 23, 42, 0.5)', // Semi-transparent dark
    shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
  }
}
