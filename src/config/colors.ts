export const brandColors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',   // Very light blue - backgrounds
    100: '#dbeafe',  // Light blue - subtle backgrounds
    200: '#bfdbfe',  // Lighter blue - borders
    300: '#93c5fd',  // Light blue - hover states
    400: '#60a5fa',  // Medium blue - secondary elements
    500: '#3b82f6',  // Main brand blue - primary buttons
    600: '#2563eb',  // Darker blue - primary actions
    700: '#1d4ed8',  // Dark blue - hover states
    800: '#1e40af',  // Darker blue - text on light backgrounds
    900: '#1e3a8a',  // Darkest blue - headings
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',   // Off-white - main backgrounds
    100: '#f5f5f5',  // Light gray - card backgrounds
    200: '#e5e5e5',  // Light gray - borders
    300: '#d4d4d4',  // Medium gray - dividers
    400: '#a3a3a3',  // Medium gray - secondary text
    500: '#737373',  // Gray - body text
    600: '#525252',  // Dark gray - headings
    700: '#404040',  // Darker gray - strong headings
    800: '#262626',  // Very dark gray - primary text
    900: '#171717',  // Almost black - emphasis text
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // White variations
  white: '#ffffff',
  'white-soft': '#fefefe',
  'white-warm': '#fafafa',
}

// Color combinations for different UI elements
export const colorSchemes = {
  // Primary button
  primaryButton: {
    background: brandColors.primary[600],
    hover: brandColors.primary[700],
    text: brandColors.white,
    border: brandColors.primary[600],
  },
  
  // Secondary button
  secondaryButton: {
    background: brandColors.white,
    hover: brandColors.neutral[50],
    text: brandColors.primary[600],
    border: brandColors.primary[200],
  },
  
  // Card design
  card: {
    background: brandColors.white,
    border: brandColors.neutral[200],
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  
  // Invoice header
  invoiceHeader: {
    background: brandColors.primary[600],
    text: brandColors.white,
    accent: brandColors.primary[400],
  },
  
  // Status indicators
  status: {
    paid: brandColors.success[500],
    pending: brandColors.warning[500],
    overdue: brandColors.error[500],
  }
}
