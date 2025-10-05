// Helper function for display name
export function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || 
         user?.user_metadata?.name || 
         user?.email?.split('@')[0] || 
         'User'
}

// Helper function for user initials
export function getUserInitial(user: any): string {
  const name = getUserDisplayName(user)
  return name.charAt(0).toUpperCase()
}
