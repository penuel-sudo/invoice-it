# ClientDropdown Component - Usage Guide

## Overview
The `ClientDropdown` is a reusable component that allows users to select existing clients and auto-fill their information in any invoice template.

## Features
- ✅ **Branded Dropdown Design** - Matches your app's design system
- ✅ **Auto-fill Client Data** - Only fills fields that have data
- ✅ **Avatar Initials** - Shows client initials in a circular avatar
- ✅ **Company Badge** - Displays company name if available
- ✅ **Responsive** - Works on mobile and desktop
- ✅ **Serverless** - Uses Supabase client-side queries (secure with RLS)
- ✅ **Reusable** - Can be plugged into any template seamlessly

## Security
The component is **serverless** and uses Supabase's client-side API with Row Level Security (RLS). This means:
- ✅ Users can only see their own clients
- ✅ No API endpoints needed
- ✅ Direct database queries secured by RLS policies
- ✅ No vulnerability to incursion

## How to Use in Any Template

### Step 1: Import the Component

```typescript
import ClientDropdown from '../../ClientDropdown'
import type { Client } from '../../ClientDropdown'
import toast from 'react-hot-toast'
```

### Step 2: Add to Your Form

Place it **above** your client input fields:

```typescript
{/* Client Dropdown - Auto-fill client info */}
<div>
  <label style={{ /* ... */ }}>
    Select Existing Client (Optional)
  </label>
  <ClientDropdown
    onClientSelect={(client: Client) => {
      // Auto-fill only fields that have data
      setFormData(prev => ({
        ...prev,
        clientName: client.name || prev.clientName,
        clientEmail: client.email || prev.clientEmail,
        clientPhone: client.phone || prev.clientPhone,
        clientAddress: client.address || prev.clientAddress,
        clientCompanyName: client.company_name || prev.clientCompanyName
        // Add any other client fields your template uses
      }))
      toast.success(`Client "${client.name}" info loaded!`)
    }}
    placeholder="Search and select a client to auto-fill..."
  />
</div>

{/* Optional divider */}
<div style={{
  height: '1px',
  background: 'linear-gradient(to right, transparent, #e5e7eb, transparent)',
  margin: '0.5rem 0'
}} />

{/* Your existing client input fields below */}
<div>
  <label>Client Name *</label>
  <input
    value={formData.clientName}
    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
    placeholder="Enter client name"
  />
</div>
```

### Step 3: Map Your Fields

The auto-fill function uses this logic:
```typescript
client.name || prev.clientName  // Use client data if it exists, otherwise keep current value
```

This means:
- ✅ If client has a name → fills it in
- ✅ If client has no email → keeps the current email value
- ✅ Only updates fields with actual data

## Component Props

```typescript
interface ClientDropdownProps {
  onClientSelect: (client: Client) => void  // Called when a client is selected
  selectedClientId?: string                 // Optional: Pre-select a client
  placeholder?: string                      // Optional: Custom placeholder text
}
```

## Client Object Structure

```typescript
interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company_name?: string
  country_code?: string
  country_name?: string
}
```

## Examples

### Basic Usage
```typescript
<ClientDropdown
  onClientSelect={(client) => {
    setFormData(prev => ({ ...prev, clientName: client.name }))
  }}
/>
```

### With All Fields
```typescript
<ClientDropdown
  onClientSelect={(client) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name || '',
      clientEmail: client.email || '',
      clientPhone: client.phone || '',
      clientAddress: client.address || '',
      clientCompanyName: client.company_name || ''
    }))
    toast.success('Client info loaded!')
  }}
  placeholder="Choose a client..."
/>
```

### With Custom Field Mapping
If your template uses different field names:

```typescript
<ClientDropdown
  onClientSelect={(client) => {
    setFormData(prev => ({
      ...prev,
      billToName: client.name || '',           // Your custom field
      billToEmail: client.email || '',         // Your custom field
      billToAddress: client.address || '',     // Your custom field
      billToCompany: client.company_name || '' // Your custom field
    }))
  }}
/>
```

## Template Integration Checklist

When adding to a new template:

- [ ] Import `ClientDropdown` and `Client` type
- [ ] Import `toast` from `react-hot-toast`
- [ ] Place component above client input fields
- [ ] Map client object fields to your formData structure
- [ ] Add optional divider for visual separation
- [ ] Test with clients that have partial data
- [ ] Test with clients that have all fields filled

## Already Implemented

✅ **Default Template** (`DefaultCreate.tsx`)
- Location: Above "Client Name" field
- Auto-fills: name, email, phone, address, company_name

## To Add in Future Templates

When you create new templates, simply copy the implementation from `DefaultCreate.tsx` and adjust the field names to match your template's formData structure!

