import React, { useEffect, useState } from "react";
import { runOnJS } from "react-native-reanimated";

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWalkThrough } from "../hooks/useWalkThrough";
import { Color } from "../utils/all-colors";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

type StepProps = {
  target?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title: string;
  content: string;
  isVisible?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
};

type WalkthroughProps = {
  steps: StepProps[];
  onFinish: () => void;
  setCountCurrentStep: (step: number) => void;
};

const Step: React.FC<StepProps> = ({
  target,
  title,
  content,
  isVisible,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onFinish,
}) => {
  const opacity = useSharedValue(0);
  const [position, setPosition] = useState<{ top: number; bottom: number }>();

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  useEffect(() => {
    if (target) {
      const center = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
      };
      const relativeToTop = center.y;
      const relativeToBottom = Math.abs(center.y - screenHeight);

      const verticalPosition =
        relativeToTop > relativeToBottom ? "top" : "bottom";

      if (verticalPosition === "top") {
        setPosition({ bottom: screenHeight - target.y + 20, top: 160 });
      } else {
        setPosition({ top: target.y + target.height + 20, bottom: 100 });
      }
    }
  }, [target]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isVisible || !position) return null;

  return (
    <Animated.View style={[styles.stepContainer, animatedStyle]}>
      {target && (
        <View
          style={[
            styles.highlight,
            {
              left: target.x - 5,
              top: target.y - 5,
              width: target.width + 10,
              height: target.height + 10,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.content,
          {
            top: position.top,
            bottom: position.bottom,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            width: "100%",
            paddingHorizontal: 20,
            paddingVertical: 4,
          }}
        >
          <TouchableOpacity onPress={onFinish} style={[styles.skipButton]}>
            <Text
              style={{
                color: "#fff",
              }}
            >
              Stop Tutorial
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              paddingVertical: 0,
              paddingHorizontal: 20,
            }}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{content}</Text>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            {currentStep! > 0 && (
              <TouchableOpacity
                onPress={onPrevious}
                style={[
                  styles.button,
                  {
                    backgroundColor: Color.light.onSurface,
                  },
                ]}
              >
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
            )}

            {currentStep! < totalSteps! - 1 ? (
              <TouchableOpacity onPress={onNext} style={[styles.button]}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onSkip} style={styles.button}>
                <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export const Walkthrough: React.FC<WalkthroughProps> = ({
  steps,
  onFinish,
  setCountCurrentStep
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const opacity = useSharedValue(1);
  const { data, setData } = useWalkThrough();

  const onStop = async () => {
    if (data.showWalkThrough) {
      await AsyncStorage.setItem("isFirstSignIn", "false");
      setData({ showWalkThrough: false });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCountCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCountCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)(); // Safely call onFinish on the JS thread
      }
    });
  };

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.container]}>
        {steps.map((step, index) => (
          <Step
            key={index}
            {...step}
            isVisible={index === currentStep}
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={nextStep}
            onPrevious={prevStep}
            onFinish={onStop}
            onSkip={skip}
          />
        ))}
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  stepContainer: {},
  highlight: {
    position: "absolute",
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "#fff",
  },
  content: {
    borderWidth: 4,
    borderColor: Color.wadzzo,
    borderRadius: 30,
    position: "absolute",
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    maxHeight: 215,
    minHeight: 215,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: Color.wadzzo,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  skipButton: {
    backgroundColor: "red",

    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
});
