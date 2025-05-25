import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Train } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export function LoadingTrain() {
  const { colors } = useTheme();
  const translateX = useSharedValue(-100);
  const smoke1Opacity = useSharedValue(0);
  const smoke2Opacity = useSharedValue(0);
  const smoke3Opacity = useSharedValue(0);

  useEffect(() => {
    // Animate train movement
    translateX.value = withRepeat(
      withSequence(
        withTiming(400, {
          duration: 2000,
          easing: Easing.linear
        }),
        withTiming(-100, {
          duration: 0
        })
      ),
      -1
    );

    // Animate smoke puffs
    const animateSmoke = (opacity: Animated.SharedValue<number>) => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1
      );
    };

    // Stagger smoke animations
    animateSmoke(smoke1Opacity);
    setTimeout(() => animateSmoke(smoke2Opacity), 200);
    setTimeout(() => animateSmoke(smoke3Opacity), 400);
  }, []);

  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const smokeStyle1 = useAnimatedStyle(() => ({
    opacity: smoke1Opacity.value,
    transform: [
      { translateY: -smoke1Opacity.value * 10 },
      { scale: 1 + smoke1Opacity.value * 0.5 }
    ]
  }));

  const smokeStyle2 = useAnimatedStyle(() => ({
    opacity: smoke2Opacity.value,
    transform: [
      { translateY: -smoke2Opacity.value * 15 },
      { scale: 1 + smoke2Opacity.value * 0.5 }
    ]
  }));

  const smokeStyle3 = useAnimatedStyle(() => ({
    opacity: smoke3Opacity.value,
    transform: [
      { translateY: -smoke3Opacity.value * 20 },
      { scale: 1 + smoke3Opacity.value * 0.5 }
    ]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.smokeContainer}>
        <Animated.View style={[styles.smoke, smokeStyle1]}>
          <View style={[styles.smokeDot, { backgroundColor: colors.white }]} />
        </Animated.View>
        <Animated.View style={[styles.smoke, smokeStyle2]}>
          <View style={[styles.smokeDot, { backgroundColor: colors.white }]} />
        </Animated.View>
        <Animated.View style={[styles.smoke, smokeStyle3]}>
          <View style={[styles.smokeDot, { backgroundColor: colors.white }]} />
        </Animated.View>
      </View>
      <Animated.View style={trainStyle}>
        <Train size={48} color={colors.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokeContainer: {
    position: 'absolute',
    flexDirection: 'row',
    left: 20,
    bottom: 40,
  },
  smoke: {
    marginHorizontal: 4,
  },
  smokeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  }
}); 