import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyPressable from '@/components/MyPressable';
import { AppAnimation, AppImages } from '@/assets';
import { useTheme } from '@/components/theme/ThemeProvider';

interface Props {
  onNextClick: () => void;
  animationController: React.RefObject<Animated.Value>;
}

const SplashView: React.FC<Props> = ({ onNextClick, animationController }) => {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const splashTranslateY = animationController.current.interpolate({
    inputRange: [0, 0.2, 0.8],
    outputRange: [0, -window.height, -window.height],
  });

  const introImageData = Image.resolveAssetSource(AppImages.introduction_image);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    title: {
      color: 'black',
      fontSize: 25,
      textAlign: 'center',
      fontFamily: 'WorkSans-Bold',
      paddingVertical: 8,
    },
    subtitle: {
      color: 'black',
      textAlign: 'center',
      fontFamily: 'WorkSans-Regular',
      paddingHorizontal: 24,
    },
    footer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: 8,
      gap: 16,
    },
    buttonContainer: {
      borderRadius: 38,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 56,
    },
    buttonText: {
      color: 'white',
    },
  });
  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: theme.colors.background, transform: [{ translateY: splashTranslateY }] }}
    >
      <ScrollView style={{ flexGrow: 0 }} alwaysBounceVertical={false}>
        <View>
          <Image
            style={{
              width: window.width,
              height: window.height * 0.7,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 20,

            }}
            source={AppImages.introduction_image}
          />
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 8 + insets.bottom }]}>
        <Text style={styles.title}>Wadzzo</Text>
        <Text style={styles.subtitle}>
          Collect items and rewards from your favorite brands.
        </Text>
        <View style={styles.buttonContainer}>
          <MyPressable
            style={styles.button}
            android_ripple={{ color: 'powderblue' }}
            touchOpacity={0.6}
            onPress={() => onNextClick()}
          >
            <Text style={styles.buttonText}>Let's begin</Text>
          </MyPressable>
        </View>
      </View>
    </Animated.View>
  );
};



export default SplashView;
