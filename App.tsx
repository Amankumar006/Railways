import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated. Use style.pointerEvents',
]);

// ... rest of your App.tsx code ... 