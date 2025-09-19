# Navigation Components

## ProfileDropdown

A modern, responsive profile dropdown component that provides quick access to user actions and admin features.

### Features

- **Avatar Display**: Shows user avatar with fallback to initials
- **User Information**: Displays name, email, and role
- **Responsive Design**: Adapts to different screen sizes
- **Role-based Access**: Shows admin dashboard option for admin/moderator users
- **Modern Styling**: Gradient avatars, hover effects, and smooth transitions
- **Keyboard Navigation**: Full keyboard accessibility support
- **Loading States**: Shows loading state during sign out

### Usage

```tsx
import { ProfileDropdownServer } from "@/components/navigation/ProfileDropdownServer";

// In your layout or header component
<ProfileDropdownServer />;
```

### Menu Options

- **Profile**: Navigate to user profile page
- **Settings**: Access user settings and preferences
- **Admin Dashboard**: (Admin/Moderator only) Access admin panel
- **Sign Out**: Securely sign out of the application

### Styling

The component uses:

- Tailwind CSS for styling
- Radix UI for dropdown functionality
- Lucide React for icons
- Gradient backgrounds for avatars
- Responsive breakpoints (hidden on mobile, visible on desktop)

### Role Detection

The component automatically detects user roles and shows appropriate options:

- Regular users see Profile, Settings, and Sign Out
- Admin/Moderator users additionally see Admin Dashboard option
- Role badges are color-coded (admin: primary, moderator: secondary, user: outline)
