import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';


import { router } from 'expo-router';
import SplashView from './(onboarding)/SplashView';
import ExploreView from './(onboarding)/ExploreView';
import CollectView from './(onboarding)/CollectView';
import TopBackSkipView from '@/components/TopBackSkipView';
import CenterNextButton from '@/components/CenterNextButton';
import MoodDiaryView from './(onboarding)/WinView';
import { useTheme } from '@/components/theme/ThemeProvider';

const IntroductionAnimationScreen: React.FC = () => {

  const window = useWindowDimensions();
  const themes = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const animationController = useRef<Animated.Value>(new Animated.Value(0));
  const animValue = useRef<number>(0);

  useEffect(() => {
    animationController.current.addListener(({ value }) => {
      animValue.current = value;
      setCurrentPage(value);
    });
  }, []);

  const relaxTranslateY = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6],
    outputRange: [window.height, 0, 0, 0],
  });

  const playAnimation = useCallback(
    (toValue: number, duration: number = 1600) => {
      Animated.timing(animationController.current, {
        toValue,
        duration,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
        // here it is false only cause of width animation in 'NextButtonArrow.tsx', as width doesn't support useNativeDriver: true
        // TODO:- find better solution so we can use true here and animation also work
        useNativeDriver: false,
      }).start();
    },
    [],
  );

  const onNextClick = useCallback(() => {
    let toValue;
    if (animValue.current === 0) {
      toValue = 0.2;
    } else if (animValue.current >= 0 && animValue.current <= 0.2) {
      toValue = 0.4;
    } else if (animValue.current > 0.2 && animValue.current <= 0.4) {
      toValue = 0.6;
    } else if (animValue.current > 0.4 && animValue.current <= 0.6) {
      router.back();
    }

    toValue !== undefined && playAnimation(toValue);
  }, [playAnimation, router]);

  const onBackClick = useCallback(() => {
    let toValue;
    if (animValue.current >= 0.2 && animValue.current < 0.4) {
      toValue = 0.0;
    } else if (animValue.current >= 0.4 && animValue.current < 0.6) {
      toValue = 0.2;
    } else if (animValue.current >= 0.6 && animValue.current < 0.8) {
      toValue = 0.4;
    }
    toValue !== undefined && playAnimation(toValue);
  }, [playAnimation]);

  const onSkipClick = useCallback(() => {
    playAnimation(0.8, 1200);
  }, [playAnimation]);

  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(245, 235, 226)' }}>
      <StatusBar barStyle={`${currentPage > 0 ? 'dark' : 'light'}-content`} />
      <SplashView {...{ onNextClick, animationController }} />

      <Animated.View
        style={[
          styles.scenesContainer,
          { backgroundColor: themes.colors.background },
          { transform: [{ translateY: relaxTranslateY }] },
        ]}
      >
        <ExploreView {...{ animationController }} />

        <CollectView {...{ animationController }} />

        <MoodDiaryView {...{ animationController }} />
      </Animated.View>

      <TopBackSkipView {...{ onBackClick, onSkipClick, animationController }} />

      <CenterNextButton {...{ onNextClick, animationController }} />
    </View>
  );
};

const styles = StyleSheet.create({
  scenesContainer: {
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
});

export default IntroductionAnimationScreen;
