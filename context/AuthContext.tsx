import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_PIN_KEY = 'APP_PIN_SECURE_KEY';
const APP_BIOMETRICS_ENABLED_KEY = 'APP_BIOMETRICS_ENABLED';
const APP_LOCKOUT_TIME_KEY = 'APP_LOCKOUT_TIME';
const FAILED_ATTEMPTS_KEY = 'APP_FAILED_ATTEMPTS';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

// Helper functions to handle cross-platform storage
const setStorageItem = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const getStorageItem = async (key: string) => {
    if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

const deleteStorageItem = async (key: string) => {
    if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
};

type AuthContextType = {
    isAppLockEnabled: boolean;
    isAppUnlocked: boolean;
    isBiometricsEnabled: boolean;
    hasBiometricHardware: boolean;
    isLoading: boolean;
    setupPIN: (pin: string) => Promise<void>;
    removePIN: () => Promise<void>;
    verifyPIN: (pin: string) => Promise<{ success: boolean; lockoutUntil?: number | null; remainingAttempts?: number }>;
    getLockoutState: () => Promise<number | null>;
    toggleBiometrics: (enabled: boolean) => Promise<void>;
    authenticateWithBiometrics: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [isAppUnlocked, setIsAppUnlocked] = useState(true);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSecurityState();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [isAppLockEnabled]);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        // Lock the app if it goes to background and app lock is enabled
        if (nextAppState.match(/inactive|background/) && isAppLockEnabled) {
            setIsAppUnlocked(false);
        }
    };

    const checkSecurityState = async () => {
        setIsLoading(true);
        try {
            // Check hardware support (Web doesn't support biometrics)
            let hasHardware = false;
            let isEnrolled = false;
            if (Platform.OS !== 'web') {
                 hasHardware = await LocalAuthentication.hasHardwareAsync();
                 isEnrolled = await LocalAuthentication.isEnrolledAsync();
            }
            setHasBiometricHardware(hasHardware && isEnrolled);

            // Check if PIN is set
            const savedPin = await getStorageItem(APP_PIN_KEY);
            const isLocked = !!savedPin;
            setIsAppLockEnabled(isLocked);
            setIsAppUnlocked(!isLocked); // initially locked if a PIN exists

            // Check if user enabled biometrics
            if (isLocked) {
                const biometricsSetting = await getStorageItem(APP_BIOMETRICS_ENABLED_KEY);
                setIsBiometricsEnabled(biometricsSetting === 'true');
            }
        } catch (error) {
            console.error('Error checking security state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupPIN = async (pin: string) => {
        try {
            await setStorageItem(APP_PIN_KEY, pin);
            setIsAppLockEnabled(true);
            setIsAppUnlocked(true);
        } catch (error) {
            console.error('Failed to save PIN:', error);
            throw error;
        }
    };

    const removePIN = async () => {
        try {
            await deleteStorageItem(APP_PIN_KEY);
            await deleteStorageItem(APP_BIOMETRICS_ENABLED_KEY);
            await deleteStorageItem(APP_LOCKOUT_TIME_KEY);
            await deleteStorageItem(FAILED_ATTEMPTS_KEY);
            setIsAppLockEnabled(false);
            setIsAppUnlocked(true);
            setIsBiometricsEnabled(false);
        } catch (error) {
            console.error('Failed to remove PIN:', error);
            throw error;
        }
    };

    const getLockoutState = async () => {
        try {
            const lockoutTimeStr = await getStorageItem(APP_LOCKOUT_TIME_KEY);
            if (lockoutTimeStr) {
                const lockoutTime = parseInt(lockoutTimeStr, 10);
                if (Date.now() < lockoutTime) {
                    return lockoutTime;
                } else {
                    // Lockout expired, clear limits
                    await deleteStorageItem(APP_LOCKOUT_TIME_KEY);
                    await deleteStorageItem(FAILED_ATTEMPTS_KEY);
                }
            }
        } catch (e) {
            console.error('Error getting lockout state:', e);
        }
        return null;
    };

    const verifyPIN = async (pin: string) => {
        try {
            // Check if currently locked out
            const currentLockout = await getLockoutState();
            if (currentLockout) {
                 return { success: false, lockoutUntil: currentLockout, remainingAttempts: 0 };
            }

            const savedPin = await getStorageItem(APP_PIN_KEY);
            if (savedPin === pin) {
                // Success: clear failed attempts
                await deleteStorageItem(FAILED_ATTEMPTS_KEY);
                await deleteStorageItem(APP_LOCKOUT_TIME_KEY);

                setIsAppUnlocked(true);
                return { success: true };
            } else {
                // Failed attempt
                let attempts = 1;
                const savedAttempts = await getStorageItem(FAILED_ATTEMPTS_KEY);
                if (savedAttempts) {
                    attempts = parseInt(savedAttempts, 10) + 1;
                }
                
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
                    await setStorageItem(APP_LOCKOUT_TIME_KEY, lockoutUntil.toString());
                    await deleteStorageItem(FAILED_ATTEMPTS_KEY); // Reset for next time
                    return { success: false, lockoutUntil, remainingAttempts: 0 };
                } else {
                    await setStorageItem(FAILED_ATTEMPTS_KEY, attempts.toString());
                    return { success: false, remainingAttempts: MAX_FAILED_ATTEMPTS - attempts };
                }
            }
        } catch (error) {
            console.error('Failed to verify PIN:', error);
            return { success: false };
        }
    };

    const toggleBiometrics = async (enabled: boolean) => {
        try {
            await setStorageItem(APP_BIOMETRICS_ENABLED_KEY, enabled.toString());
            setIsBiometricsEnabled(enabled);
        } catch (error) {
            console.error('Failed to toggle biometrics:', error);
            throw error;
        }
    };

    const authenticateWithBiometrics = async () => {
        if (Platform.OS === 'web') return false;

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock App',
                fallbackLabel: 'Use PIN',
                disableDeviceFallback: true, // We have our own custom PIN fallback
            });

            if (result.success) {
                setIsAppUnlocked(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAppLockEnabled,
                isAppUnlocked,
                isBiometricsEnabled,
                hasBiometricHardware,
                isLoading,
                setupPIN,
                removePIN,
                verifyPIN,
                getLockoutState,
                toggleBiometrics,
                authenticateWithBiometrics,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
