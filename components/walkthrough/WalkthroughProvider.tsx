import React, { useState } from "react";
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
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWalkThrough } from "../hooks/useWalkThrough";
import { Color } from "../utils/all-colors";

const { width, height } = Dimensions.get("window");

type StepProps = {
  target?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title: string;
  content: string;
};

type WalkthroughProps = {
  steps: StepProps[];
  onFinish: () => void;
};

const Step: React.FC<StepProps & { isVisible: boolean }> = ({
  target,
  title,
  content,
  isVisible,
}) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

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
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{content}</Text>
      </View>
    </Animated.View>
  );
};

export const Walkthrough: React.FC<WalkthroughProps> = ({
  steps,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const opacity = useSharedValue(1);
  const { data, setData } = useWalkThrough();
  const onStop = async () => {
    if (data.showWalkThrough) {
      await AsyncStorage.setItem("isFirstSignIn", "false"); // Mark the user as signed in
      setData({
        showWalkThrough: false,
      });
    }
  };
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {steps.map((step, index) => (
          <Step key={index} {...step} isVisible={index === currentStep} />
        ))}
        <View style={styles.navigation}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={prevStep} style={styles.button}>
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disable}></View>
          )}
          <TouchableOpacity onPress={nextStep} style={styles.button}>
            <Text style={styles.buttonText}>
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onStop()} style={styles.stopButton}>
          <Text style={styles.skipButtonText}>Stop</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  stepContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    position: "absolute",
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "#fff",
  },
  content: {
    position: "absolute",
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  disable: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  skipButton: {
    backgroundColor: Color.wadzzo,
    position: "absolute",
    bottom: 130,
    right: 20,
    paddingHorizontal: 20,
    borderRadius: 5,
    paddingVertical: 5,
  },
  stopButton: {
    position: "absolute",
    bottom: 130,
    right: 100,
    backgroundColor: "red",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
