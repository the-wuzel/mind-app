import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Dot = ({ index, currentStep, themeColors }: { index: number, currentStep: number, themeColors: any }) => {
  const isActive = index === currentStep;
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? 24 : 8, { duration: 300 }),
      backgroundColor: withTiming(
        isActive ? themeColors.primaryButton : themeColors.cardBorder,
        { duration: 300 }
      ),
    };
  }, [isActive, themeColors]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to mindApp',
    subtitle: 'Your personal space for reflection, tracking routines, and building better habits.',
  },
  {
    title: 'Morning Routine',
    subtitle: 'Start your day right. Enter the app once every morning to set your intentions and prepare for the day ahead.',
  },
  {
    title: 'Evening Routine',
    subtitle: 'Reflect on your progress. Check in once every evening to log your day, clear your mind, and wind down.',
  },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { completeOnboarding } = useOnboarding();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(0);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Back Button */}
      {currentStep > 0 && (
        <TouchableOpacity 
          style={[styles.backButton, { top: Math.max(insets.top, 16) }]} 
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={28} color={themeColors.text} />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {step.subtitle}
        </Text>
      </View>
      
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <Dot
              key={index}
              index={index}
              currentStep={currentStep}
              themeColors={themeColors}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primaryButton }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isLastStep ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 48, // Add extra padding for safe area
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
