import React, { useRef } from 'react';
import { StyleSheet, Text, Animated, useWindowDimensions, Image } from 'react-native';
import { AppAnimation, AppImages } from '@/assets';
import LottieView from "lottie-react-native";
import { useTheme } from '@/components/theme/ThemeProvider';
interface Props {
  animationController: React.RefObject<Animated.Value>;
}

const IMAGE_WIDTH = 350;
const IMAGE_HEIGHT = 250;

const CollectView: React.FC<Props> = ({ animationController }) => {
  const window = useWindowDimensions();
  const theme = useTheme();
  const careRef = useRef<Text | null>(null);

  const slideAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6],
    outputRange: [window.width, window.width, 0, -window.width],
  });

  const careEndVal = 26 * 2; // 26 being text's height (font size)
  const careAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8],
    outputRange: [careEndVal, careEndVal, 0, -careEndVal, -careEndVal],
  });

  const imageEndVal = IMAGE_WIDTH * 4;
  const imageAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8],
    outputRange: [imageEndVal, imageEndVal, 0, -imageEndVal, -imageEndVal],
  });

  return (
    <Animated.View
      style={[styles.container,
      { backgroundColor: theme.colors.background },
      { transform: [{ translateX: slideAnim }] }]}
    >
      <Animated.View style={{ transform: [{ translateX: imageAnim }] }}>
        <Image
          source={AppImages.collect_image}
          style={{
            width: window.width,
            height: window.height * 0.7,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,
            padding: 4,

          }}

        />
      </Animated.View>

      <Text style={styles.subtitle}>
        Collect items and rewards from your favorite brands.
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    paddingBottom: 400,
  },
  image: {
    maxWidth: IMAGE_WIDTH,
    maxHeight: IMAGE_HEIGHT,
  },
  title: {
    color: 'black',
    fontSize: 26,
    textAlign: 'center',
    fontFamily: 'WorkSans-Bold',
  },
  subtitle: {
    color: 'black',
    textAlign: 'center',
    fontFamily: 'WorkSans-Regular',
    paddingHorizontal: 64,
    paddingVertical: 16,
  },
});

export default CollectView;
