import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { lightPalette } from '@/constants/theme';

const DURATION = 520;

/**
 * Brand splash that covers the first frame while the initial data loads, then
 * hands off to the native splash screen and fades out.
 */
export function BrandSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const keyframe = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    55: { opacity: 1 },
    100: {
      opacity: 0,
      transform: [{ scale: 1.06 }],
      easing: Easing.out(Easing.cubic),
    },
  });

  const content = (
    <View style={styles.content}>
      <View style={styles.mark}>
        <MaterialCommunityIcons name="star-four-points" size={34} color={lightPalette.onPrimary} />
      </View>
    </View>
  );

  if (animate) {
    return (
      <Animated.View
        entering={keyframe.duration(DURATION).withCallback((finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(setVisible, false);
          }
        })}
        style={styles.overlay}>
        {content}
      </Animated.View>
    );
  }

  return (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={styles.overlay}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: lightPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});
