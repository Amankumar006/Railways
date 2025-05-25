# Railway Coach Inspection Application

## Overview
A mobile application built with React Native/Expo and TypeScript for Indian Railways coach inspection management. The application uses Supabase for authentication and database operations.

## Features

### Authentication
- Login and signup with email/password
- "Remember me" functionality
- Password reset flow
- Row-Level Security (RLS) policies for data protection

### User Management
- Role-based access (inspectors, supervisors, managers)
- Profile management
- Account approval workflow

### Coach Inspection
- Schedule management
- Inspection forms and checklists
- Real-time data synchronization
- Reporting and analytics

## UI/UX Enhancements

### Indian Railways Theme
- Color scheme based on Indian Railways branding and Indian flag colors
- Custom splash screen with Indian Railways logo
- Bilingual elements (English and Hindi) for better accessibility
- Responsive and accessible design

### Themed Components
- Custom themed components for consistent UI
- Responsive cards, buttons, and inputs
- Status indicators with appropriate Indian Railways colors
- Dashboard with metrics visualization

## Technical Stack

- **Frontend**: React Native, Expo, TypeScript
- **State Management**: Context API
- **Navigation**: Expo Router
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: React Native StyleSheet with custom theming

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. **Set up environment variables for Supabase** (IMPORTANT - Required to fix 404 login errors):
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```
   - Get these values from your Supabase dashboard: Settings > API
   - See `SETUP_INSTRUCTIONS.md` for detailed steps
4. Run the development server: `npx expo start`

## Common Issues

### 404 Error During Login
If you're getting a 404 error when trying to log in, it's because the Supabase environment variables are not configured. Follow step 3 above to fix this issue.

## Required Assets

Before running the application, please add the following assets to the `assets/images` directory:

- `indian-railway-bg.jpg` - Background image for login/signup screens
- `ir-logo.png` - Indian Railways logo
- `splash.png` - Splash screen image

## Future Enhancements

### Profile Management
- Add functionality to update user profile information
- Implement profile image upload

### Security Improvements
- Add refresh token handling
- Implement token expiration checks
- Add protection for sensitive routes

### User Experience
- Implement biometric authentication for mobile
- Add offline mode with data synchronization
- Add social login options

## UI/UX Considerations
Uses a card-based interface for main actions
Implements consistent styling with themed components
Supports both light and dark mode through the colorScheme system
Uses icons from the Lucide React Native library for visual clarity
Implements responsive layouts for different screen sizes
Areas for Improvement
The Analytics Dashboard and User Management features are placeholders showing alerts - these features are marked as "coming soon"
The trip reports page is quite lengthy (1058 lines) and could benefit from being broken down into smaller components
Some navigation logic relies on URL parameters which might need additional handling in a mobile context
