# Invoice-It Codebase Reference

## 🏗️ **Project Overview**
- **Framework**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Custom design system with Tailwind CSS 4.1.12
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **UI**: Radix UI + Custom components
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router v7

## 📁 **Folder Structure**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Radix + custom)
│   ├── layout/         # Layout components (Sidebar, Layout)
│   └── [Feature Components]
├── pages/              # Route components
├── lib/                # Utilities, hooks, storage
│   ├── storage/        # localStorage utilities
│   └── [Core utilities]
├── Routes/             # React Router configuration
├── stylings/           # Design system (colors, typography, spacing)
└── store/              # Zustand state management
```

## 🎨 **Design System Patterns**

### **Color System:**
- **Primary**: Green-based palette (`#22c55e` main brand color)
- **Neutral**: Gray scale for text and backgrounds
- **Usage**: `brandColors.primary[600]` for consistent theming

### **Typography:**
- **Font**: Poppins (primary font family)
- **Presets**: `typographyPresets` for consistent text styling
- **Usage**: Applied via `getTypographyStyle()` function

### **Component Styling Pattern:**
```typescript
style={{
  backgroundColor: brandColors.white,
  border: `1px solid ${brandColors.neutral[200]}`,
  borderRadius: '50px', // Signature rounded design
  fontFamily: 'Poppins, sans-serif'
}}
```

## 🗄️ **Database Schema (Supabase PostgreSQL)**

### **Tables:**
```sql
-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  country_code TEXT,
  phone_prefix TEXT,
  language_code TEXT,
  currency_code TEXT,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address TEXT,
  client_phone TEXT,
  client_company_name TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_total DECIMAL(10,2) NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Storage Buckets:**
- `profile-pictures` - User profile pictures

## 🍞 **Toast Notification System**

### **Configuration:**
- **Package**: `react-hot-toast` v2.6.0
- **Config**: `src/lib/toastConfig.ts` with brand colors
- **Position**: Top-right, 4-second duration

### **Usage Patterns:**
```typescript
// Success messages
toast.success('Welcome back!')
toast.success('Invoice saved successfully!')

// Error messages
toast.error('Please fill in all required fields')
toast.error('Failed to save invoice: ' + error.message)

// Validation
toast.error('Password must be at least 6 characters')
```

## 🔧 **Core Features**

### **Authentication:**
- Email/Password authentication
- Google OAuth integration
- Password reset functionality
- Session management with refresh tokens
- Protected routes with `AuthWrapper`

### **Invoice Management:**
- Invoice creation with auto-save (localStorage)
- Invoice preview functionality
- Client management with recent clients
- Invoice items with tax calculations
- Status tracking (draft, sent, paid, overdue)

### **Profile Management:**
- Profile picture upload to Supabase Storage
- Profile data management
- Google avatar fallback
- Company information storage

### **UI/UX Features:**
- Country/Phone selector with real flag images (flagsapi.com)
- Responsive design with mobile considerations
- Loading states and error handling
- PWA support

## 📱 **Development Patterns**

### **State Management:**
```typescript
// localStorage utilities for offline-first approach
invoiceStorage.saveDraftDebounced()  // Auto-save with debounce
clientStorage.getRecentClients()     // Client history
```

### **API Integration:**
```typescript
// Supabase patterns
await supabase.from('invoices').insert(data)
await supabase.storage.from('profile-pictures').upload()
```

### **Component Patterns:**
```typescript
// Consistent styling approach
const getTypographyStyle = (preset) => ({ ... })
style={{ ...brandColors, ...typographyPresets }}
```

## 🚀 **Missing Features (Based on Navigation)**
- 📄 **Invoices List Page** (`/invoices`)
- 👥 **Clients Management** (`/clients`) 
- 💰 **Expenses Tracking** (`/expenses`)
- ⚙️ **Settings Page** (`/settings`)

## 💡 **Development Guidelines**

### **Code Quality Standards:**
- ✅ **TypeScript strict mode** with proper interfaces
- ✅ **Consistent naming** (PascalCase components, camelCase functions)
- ✅ **Error handling** with try-catch blocks
- ✅ **Responsive design** with mobile-first approach
- ✅ **Accessibility** considerations (alt text, proper labels)
- ✅ **Performance optimization** (debounced saves, image optimization)

### **Database Operations:**
- All database operations require SQL snippets to be run in Supabase PostgreSQL
- Use proper RLS (Row Level Security) policies
- Always include user_id for user-specific data

### **Styling Guidelines:**
- Use `brandColors` for all colors
- Use `typographyPresets` for text styling
- Maintain 50px border radius for signature rounded design
- Ensure mobile responsiveness with proper padding/spacing

## 🔗 **Key Files to Reference**
- `src/stylings/` - Design system
- `src/lib/storage/` - localStorage utilities
- `src/lib/useAuth.ts` - Authentication logic
- `src/lib/countryUtils.ts` - Country/flag utilities
- `src/lib/toastConfig.ts` - Toast configuration
- `src/components/ui/` - Base UI components
- `src/pages/AuthPage.tsx` - Authentication patterns
- `src/pages/InvoiceCreatePage.tsx` - Form patterns

## 📝 **Recent Updates**
- ✅ Enhanced CountryPhoneSelector with real flag images
- ✅ Fixed mobile responsiveness for phone input
- ✅ Improved dropdown width (400px) for better UX
- ✅ Added proper spacing to prevent text overlap
- ✅ Implemented comprehensive toast notification system
