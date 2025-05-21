// This file provides explicit configuration for Expo Router
// It helps ensure that your application routes are properly detected

// Import the root layout component
import Layout from './_layout';

// Import the default index route
import Index from './index';

// Define router settings
export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
};

// Export a default component (required by Expo Router)
export default function Router() {
  return null; // This component doesn't render anything
}

// Also export the layout and index components
export { Layout, Index };
