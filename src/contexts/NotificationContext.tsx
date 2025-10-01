import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import toast from 'react-hot-toast'

interface NotificationMetadata {
  invoice_id?: string
  invoice_number?: string
  client_id?: string
  client_name?: string
  amount?: number
  [key: string]: any
}

export interface Notification {
  id: string
  user_id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  status?: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  is_read: boolean
  created_at: string
  read_at?: string | null
  metadata?: NotificationMetadata
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'is_read' | 'created_at' | 'read_at'>) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from database
  const loadNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  // Add new notification (THE GATEWAY FUNCTION!)
  const addNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'is_read' | 'created_at' | 'read_at'>) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      // Check user's notification preferences
      const { data: profileData } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      const prefs = profileData?.notification_preferences || { enabled: true, push_enabled: true }

      // If notifications are disabled globally, don't create
      if (!prefs.enabled) {
        console.log('Notifications disabled for user')
        return
      }

      // Check specific notification type preferences
      const notifTypeMapping: Record<string, string> = {
        'Invoice Sent': 'invoice_sent',
        'Payment Received': 'payment_received',
        'Payment Overdue': 'payment_overdue',
        'Invoice Created': 'invoice_created',
        'Status Changed': 'status_changed'
      }

      const notifType = notifTypeMapping[notification.title]
      if (notifType && prefs[notifType] === false) {
        console.log(`Notification type ${notifType} disabled for user`)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          status: notification.status || null,
          metadata: notification.metadata || null,
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding notification:', error)
        toast.error('Failed to add notification')
        return
      }

      // Add to local state immediately
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)

      // Show browser notification if permission granted AND push enabled
      if (prefs.push_enabled && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo_web_app_128x128.png',
          badge: '/logo_favicon_32x32.png'
        })
      }
    } catch (error) {
      console.error('Error adding notification:', error)
      toast.error('Failed to add notification')
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId 
          ? { ...n, is_read: true, read_at: new Date().toISOString() } 
          : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        toast.error('Failed to mark all as read')
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  // Delete single notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting notification:', error)
        toast.error('Failed to delete notification')
        return
      }

      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing notifications:', error)
        toast.error('Failed to clear notifications')
        return
      }

      setNotifications([])
      setUnreadCount(0)
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  // Refresh notifications
  const refreshNotifications = async () => {
    await loadNotifications()
  }

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/logo_web_app_128x128.png',
                badge: '/logo_favicon_32x32.png'
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            )
            // Recalculate unread count
            loadNotifications()
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
            loadNotifications()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use notifications anywhere in the app
export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

