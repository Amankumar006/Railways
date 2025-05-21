module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove NativeWind temporarily to isolate the issue
      'react-native-reanimated/plugin'
    ],
  };
};
