import React, { useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from "@expo/vector-icons"
import MyPressable from '@/components/MyPressable';
import { useTheme } from '@/components/theme/ThemeProvider';
import { router } from 'expo-router';

interface Props {
  onBtnPress: () => void;
  animationController: React.MutableRefObject<Animated.Value>;
}

const NextButtonArrow: React.FC<Props> = ({
  onBtnPress,
  animationController,
}) => {
  const theme = useTheme();
  const isLastStep = useRef(false);

  // Add listener to track animation value
  React.useEffect(() => {
    const listenerId = animationController.current.addListener(({ value }) => {
      isLastStep.current = value >= 0.6;
    });

    return () => {
      animationController.current.removeListener(listenerId);
    };
  }, []);

  const handleSignUp = () => {
    if (isLastStep.current) {
      router.push('/register');
    } else {
      onBtnPress();
    }
  };

  const arrowAnim = useRef<Animated.AnimatedInterpolation<number>>(
    new Animated.Value(0),
  );

  arrowAnim.current = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6],
    outputRange: [0, 0, 0, 1],
  });

  // for transition from arrow to sign up
  const transitionAnim = arrowAnim.current.interpolate({
    inputRange: [0, 0.6, 0.7],
    outputRange: [36, 0, 0],
  });
  const opacityAnim = arrowAnim.current.interpolate({
    inputRange: [0, 0.5, 0.7],
    outputRange: [0, 0, 1],
  });
  const iconTransitionAnim = arrowAnim.current.interpolate({
    inputRange: [0, 0.3, 0.6, 0.7],
    outputRange: [0, 0, -36, -36],
  });
  const iconOpacityAnim = arrowAnim.current.interpolate({
    inputRange: [0, 0.5, 0.7],
    outputRange: [1, 0, 0],
  });
  // end

  const widthAnim = arrowAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [58, 258],
  });

  const marginBottomAnim = arrowAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [38, 0],
  });

  const radiusAnim = arrowAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: widthAnim,
          borderRadius: radiusAnim,
          marginBottom: marginBottomAnim,
          backgroundColor: theme.colors.primary,
        },
      ]}
    >
      <MyPressable
        style={{ flex: 1, justifyContent: 'center' }}
        android_ripple={{ color: 'darkgrey' }}
        onPress={handleSignUp}
      >
        <Animated.View
          style={[
            styles.signupContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: transitionAnim }],
            },
          ]}
        >
          <Text style={[styles.signupText, {
            color: theme.colors.background
          }]}>Sign Up</Text>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.background} />
        </Animated.View>

        <Animated.View
          style={[
            styles.icon,
            {
              opacity: iconOpacityAnim,
              transform: [{ translateY: iconTransitionAnim }],
            },
          ]}
        >
          <Ionicons name="arrow-forward" size={24} color={theme.colors.background} />
        </Animated.View>

      </MyPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    overflow: 'hidden',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  signupText: {
    fontSize: 18,
  },
  icon: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default NextButtonArrow;
