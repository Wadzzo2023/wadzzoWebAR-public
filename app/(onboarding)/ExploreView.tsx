import React, { useRef } from 'react';
import { StyleSheet, Text, Animated, useWindowDimensions, Image, View } from 'react-native';
import { AppAnimation, AppImages } from '@/assets';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/components/theme/ThemeProvider';

interface Props {
  animationController: React.RefObject<Animated.Value>;
}

const IMAGE_WIDTH = 350;
const IMAGE_HEIGHT = 250;

const ExploreView: React.FC<Props> = ({ animationController }) => {
  const window = useWindowDimensions();

  const relaxRef = useRef<Text | null>(null);
  const theme = useTheme();
  const relaxAnimation = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.6],
    outputRange: [-(26 * 2), 0, 0],
  });
  const textAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8],
    outputRange: [0, 0, -window.width * 2, 0, 0],
  });
  const imageAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8],
    outputRange: [0, 0, -350 * 4, 0, 0],
  });
  const slideAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.8],
    outputRange: [0, 0, -window.width, -window.width],
  });

  return (
    <Animated.View
      style={[styles.container,
      {
        backgroundColor: theme.colors.background,
      },
      { transform: [{ translateX: slideAnim }] }]}
    >
      <Animated.View style={{ transform: [{ translateX: imageAnim }] }}>
        <Image
          source={AppImages.explore_image}
          style={{
            width: window.width,
            height: window.height * 0.7,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,

          }}

        />
      </Animated.View>
      <View>

        <Animated.Text
          style={[styles.subtitle, { transform: [{ translateX: textAnim }] }]}
        >
          Open Wadzzo to start your journey to explore the world of rewards and prizes.
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 400,
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
  image: {
    maxWidth: IMAGE_WIDTH,
    maxHeight: IMAGE_HEIGHT,
  },

});

export default ExploreView;
