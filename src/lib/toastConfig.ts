import { brandColors } from '../stylings'

export const toastConfig = {
  position: 'top-right' as const,
  duration: 4000,
  style: {
    background: brandColors.white,
    color: brandColors.neutral[900],
    border: `1px solid ${brandColors.neutral[200]}`,
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: brandColors.success[500],
      secondary: brandColors.white,
    },
  },
  error: {
    iconTheme: {
      primary: brandColors.error[500],
      secondary: brandColors.white,
    },
  },
  loading: {
    iconTheme: {
      primary: brandColors.primary[500],
      secondary: brandColors.white,
    },
  },
}
