import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NextButtonArrow from '@/components/NextButtonArrow';
import { useTheme } from './theme/ThemeProvider';
import { router } from 'expo-router';

interface Props {
  onNextClick: () => void;
  animationController: React.RefObject<Animated.Value>;
}

interface DotIndicatorProps {
  index: number;
  selectedIndex: number;
}
const DotIndicator: React.FC<DotIndicatorProps> = ({
  index,
  selectedIndex,
}) => {

  const activeIndexRef = useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(activeIndexRef.current, {
      toValue: index === selectedIndex ? 1 : 0,
      duration: 480,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, index]);

  const theme = useTheme();
  const bgColor = activeIndexRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.inputFocused, theme.colors.primary],
  });

  return (
    <Animated.View
      style={[styles.pageIndicator, { backgroundColor: bgColor }]}
    />
  );
};

const CenterNextButton: React.FC<Props> = ({
  onNextClick,
  animationController,
}) => {
  const theme = useTheme();
  const opacity = useRef<Animated.Value>(new Animated.Value(0));
  const currentOpacity = useRef<number>(0);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleLoginPress = () => {
    router.push('/login');
  };
  const dots = useMemo(() => [0, 1, 2], []);

  useEffect(() => {
    // I think this condition could be better?
    animationController.current.addListener(({ value }) => {
      const isVisible = value >= 0.2 && value <= 0.6;
      if (
        (isVisible && currentOpacity.current === 0) ||
        (!isVisible && currentOpacity.current === 1)
      ) {
        Animated.timing(opacity.current, {
          toValue: isVisible ? 1 : 0,
          duration: 480,
          useNativeDriver: true,
        }).start();
        currentOpacity.current = isVisible ? 1 : 0;
      }

      if (value >= 0.5) {
        setSelectedIndex(2);
      } else if (value >= 0.3) {
        setSelectedIndex(1);
      } else if (value >= 0.1) {
        setSelectedIndex(0);
      }
    });
  }, [animationController]);

  const topViewAnim = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6],
    outputRange: [96 * 4, 0, 0, 0], // Adjusted for 3 steps
  });
  const loginTextMoveAnimation = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6],
    outputRange: [30 * 4, 30 * 4, 30 * 4, 0], // Adjusted for 3 steps
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: topViewAnim }] },
      ]}
    >
      <Animated.View
        style={[styles.dotsContainer, { opacity: opacity.current }]}
      >
        {dots.map(item => (
          <DotIndicator
            key={item}
            index={item}
            {...{ selectedIndex, animationController }}
          />
        ))}
      </Animated.View>

      <NextButtonArrow {...{ animationController }} onBtnPress={onNextClick} />

      <Animated.View
        style={[
          styles.footerTextContainer,
          { transform: [{ translateY: loginTextMoveAnimation }] },
        ]}
      >
        <Text style={{ fontFamily: 'WorkSans-Regular' }}>
          Already have an account?{' '}
        </Text>
        <Text
          onPress={handleLoginPress}
          style={[styles.loginText, { color: theme.colors.primary }]}>Login</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pageIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 4,
  },
  footerTextContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  loginText: {
    color: '#132137',
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
});

export default CenterNextButton;
