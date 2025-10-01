# 🔔 Notification Gateway System

## Overview
The Notification Gateway is a centralized system that allows any part of your app to send notifications to users. It displays notifications in a dropdown and supports browser push notifications.

---

## ✅ Features Implemented

1. **Delete Functionality** - ✅ Trash icon (Lucide React `Trash2`) on each notification
2. **Unread Badge** - ✅ Shows unread count on bell icon in Topbar
3. **Status Mapping** - ✅ Uses existing `StatusButton` component with proper styling
4. **Real-time Updates** - ✅ Supabase real-time subscriptions
5. **Browser Notifications** - ✅ Push notifications when permission granted
6. **Mark as Read** - ✅ Click notification to mark as read
7. **Mark All as Read** - ✅ Button to mark all notifications as read

---

## 📊 Status Mapping

The notification system uses the **same `StatusButton` component** from `TransactionPage` to ensure consistent styling:

### Supported Statuses:
- `paid` - Green badge
- `pending` - Yellow/Orange badge
- `overdue` - Red badge
- `draft` - Gray badge
- `cancelled` - Dark gray badge

### How It Works:
```typescript
// In NotificationItem.tsx
{status && (
  <StatusButton 
    status={status}  // Automatically gets correct styling
    size="sm" 
  />
)}
```

The `StatusButton` component handles all the color logic internally based on the status value, exactly like in the transaction list.

---

## 🚀 How to Use (From Any Component)

### 1. Import the hook:
```typescript
import { useNotification } from '../contexts/NotificationContext'
```

### 2. Use it in your component:
```typescript
function YourComponent() {
  const { addNotification } = useNotification()

  const handleAction = async () => {
    // Do something...
    
    // Send notification! 🎉
    addNotification({
      type: 'success',  // 'success' | 'warning' | 'error' | 'info'
      title: 'Invoice Sent',
      message: 'Invoice #INV-123 sent to John Doe',
      status: 'pending',  // Optional: 'paid' | 'pending' | 'overdue' | etc
      metadata: {  // Optional: Store extra data
        invoice_id: '123',
        invoice_number: 'INV-123',
        client_name: 'John Doe'
      }
    })
  }
}
```

---

## 📋 Real-World Examples

### Example 1: Invoice Sent
```typescript
// In SendInvoiceButton.tsx
const { addNotification } = useNotification()

const handleSend = async (invoice) => {
  await sendEmailToClient(invoice)
  
  addNotification({
    type: 'success',
    title: 'Invoice Sent',
    message: `Invoice #${invoice.number} sent to ${invoice.clientName}`,
    status: 'pending',
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
      client_name: invoice.clientName
    }
  })
}
```

### Example 2: Payment Received
```typescript
// In PaymentWebhook or manual payment confirmation
addNotification({
  type: 'success',
  title: 'Payment Received',
  message: `${clientName} paid $${amount} for Invoice #${invoiceNumber}`,
  status: 'paid',
  metadata: {
    invoice_id: invoiceId,
    amount: amount,
    client_id: clientId
  }
})
```

### Example 3: Overdue Invoice
```typescript
// In OverdueDetector component
addNotification({
  type: 'warning',
  title: 'Payment Overdue',
  message: `Invoice #${invoiceNumber} is ${daysOverdue} days overdue`,
  status: 'overdue',
  metadata: {
    invoice_id: invoiceId,
    days_overdue: daysOverdue
  }
})
```

### Example 4: Invoice Created
```typescript
// In CreateInvoice component
addNotification({
  type: 'info',
  title: 'Invoice Created',
  message: `Invoice #${invoiceNumber} created successfully`,
  status: 'draft',
  metadata: {
    invoice_id: invoiceId
  }
})
```

---

## 🎨 Styling (Bright vs Dimmed)

### Unread Notifications:
- **Full opacity** (bright colors)
- **Red dot** indicator (top-right)
- **Thick left border** (4px)
- **Bold title** (font-weight: 600)

### Read Notifications:
- **Reduced opacity** (0.7 - dimmed)
- **No dot** indicator
- **Thin left border** (1px)
- **Normal title** (font-weight: 500)

This is handled automatically by the `NotificationItem` component based on the `isRead` prop.

---

## 🔧 Available Methods

```typescript
const {
  notifications,        // Array of all notifications
  unreadCount,         // Number of unread notifications
  addNotification,     // Add a new notification
  markAsRead,          // Mark single notification as read
  markAllAsRead,       // Mark all notifications as read
  deleteNotification,  // Delete a single notification
  clearAll,            // Delete all notifications
  refreshNotifications // Reload notifications from DB
} = useNotification()
```

---

## 🗄️ Database Schema

The notifications are stored in the `notifications` table:

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- type: 'success' | 'warning' | 'error' | 'info'
- title: TEXT
- message: TEXT
- status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled' (optional)
- is_read: BOOLEAN (default: false)
- created_at: TIMESTAMP
- read_at: TIMESTAMP (nullable)
- metadata: JSONB (for extra data)
```

---

## 🔔 Browser Push Notifications

The system automatically requests notification permission on first load. When permission is granted:

1. **In-app notification** appears in dropdown
2. **Browser push notification** appears (even when tab is not focused)

Users can control this via their browser settings.

---

## 🎯 Next Steps

Now you can integrate notifications anywhere in your app:

1. ✅ Send button (invoice sent notification)
2. ✅ Payment confirmation (payment received notification)
3. ✅ Overdue detector (overdue warning notification)
4. ✅ Create invoice (invoice created notification)
5. ✅ Status changes (status updated notification)

Just import `useNotification()` and call `addNotification()` - that's it! 🚀

