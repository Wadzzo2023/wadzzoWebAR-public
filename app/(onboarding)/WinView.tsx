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

const WinView: React.FC<Props> = ({ animationController }) => {
  const window = useWindowDimensions();
  const theme = useTheme();

  const careRef = useRef<Text | null>(null);

  const slideAnim = animationController.current.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8],
    outputRange: [window.width, window.width, 0, -window.width],
  });

  const textEndVal = window.width * 2; // 26 being text's height (font size)
  const textAnim = animationController.current.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8],
    outputRange: [textEndVal, textEndVal, 0, -textEndVal],
  });

  const imageEndVal = IMAGE_WIDTH * 4;
  const imageAnim = animationController.current.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8],
    outputRange: [imageEndVal, imageEndVal, 0, -imageEndVal],
  });

  return (
    <Animated.View
      style={[styles.container, {
        backgroundColor: theme.colors.background,
      }, { transform: [{ translateX: slideAnim }] }]}
    >


      <Animated.View style={{ transform: [{ translateX: imageAnim }] }}>
        <Image
          source={AppImages.win_image}
          style={{
            width: window.width,

            height: window.height * 0.7,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,
          }}

        />
      </Animated.View>
      <Animated.Text
        style={[styles.subtitle, { transform: [{ translateX: textAnim }] }]}
      >
        Win prizes, bounties and rewards from your favorite local and national brands.
      </Animated.Text>
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

export default WinView;
