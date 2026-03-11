import { initDatabase } from '@/services/database';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { SettingsProvider } from '@/context/SettingsContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboarding } from '@/hooks/useOnboarding';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const { isLoading: isOnboardingLoading, hasViewedOnboarding } = useOnboarding();

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && !isOnboardingLoading) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, isOnboardingLoading]);

  if (!appIsReady || isOnboardingLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SettingsProvider>
          <SnackbarProvider>
            <Stack>
              {hasViewedOnboarding ? (
                <>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </>
              ) : (
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              )}
            </Stack>
          </SnackbarProvider>
        </SettingsProvider>
        <StatusBar style="auto" backgroundColor={Colors[colorScheme ?? 'light'].background} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
