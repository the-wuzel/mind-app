import { useMemo, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 4;

export function LockScreen() {
    const { verifyPIN, isBiometricsEnabled, authenticateWithBiometrics, hasBiometricHardware } = useAuth();
    const { primaryColor } = useSettings();
    const colorScheme = useColorScheme() ?? 'light';
    const [pin, setPin] = useState<string>('');
    const [shake, setShake] = useState(false); // Can be used to animate later if desired
    const [errorMsg, setErrorMsg] = useState('');

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);

    useEffect(() => {
        // Trigger biometrics automatically if enabled
        if (isBiometricsEnabled && hasBiometricHardware) {
            handleBiometricAuth();
        }
    }, [isBiometricsEnabled, hasBiometricHardware]);

    useEffect(() => {
        if (pin.length === PIN_LENGTH) {
            handleVerifyPin(pin);
        }
    }, [pin]);

    const handleBiometricAuth = async () => {
        setErrorMsg('');
        const success = await authenticateWithBiometrics();
        if (!success) {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleVerifyPin = async (currentPin: string) => {
        const isValid = await verifyPIN(currentPin);
        if (isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg('Incorrect PIN');
            setPin('');
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleNumberPress = (num: number) => {
        if (pin.length < PIN_LENGTH) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setErrorMsg('');
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setPin(prev => prev.slice(0, -1));
            setErrorMsg('');
        }
    };

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < PIN_LENGTH; i++) {
            const isFilled = i < pin.length;
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.dot,
                        isFilled && styles.dotFilled,
                    ]}
                />
            );
        }
        return <View style={styles.dotsContainer}>{dots}</View>;
    };

    const NumberPad = () => {
        const rows = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ];

        return (
            <View style={styles.numberPadContainer}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map(num => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numberButton}
                                onPress={() => handleNumberPress(num)}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={styles.numberText}>{num}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                
                <View style={styles.numberRow}>
                    {isBiometricsEnabled && hasBiometricHardware ? (
                        <TouchableOpacity
                            style={styles.numberButton}
                            onPress={handleBiometricAuth}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="face-recognition" size={32} color={colors.textPrimary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.numberButton} />
                    )}
                    
                    <TouchableOpacity
                        style={styles.numberButton}
                        onPress={() => handleNumberPress(0)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.numberText}>0</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.numberButton}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="lock" size={48} color={colors.primaryButton} />
                    <ThemedText style={styles.title}>Welcome Back</ThemedText>
                    <ThemedText style={styles.subtitle}>Enter your PIN to unlock</ThemedText>
                </View>

                {renderDots()}
                <ThemedText style={styles.errorText}>{errorMsg || ' '}</ThemedText>

                <NumberPad />
            </View>
        </ThemedView>
    );
}

const createStyles = (theme: 'light' | 'dark', colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999, // Ensure it's on top of everything
        elevation: 9999,
        backgroundColor: colors.background, // Solid background so app is hidden
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginBottom: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.textSecondary,
    },
    dotFilled: {
        backgroundColor: colors.primaryButton,
        borderColor: colors.primaryButton,
    },
    errorText: {
        color: '#ff4444',
        minHeight: 24,
        marginBottom: 40,
        fontSize: 14,
    },
    numberPadContainer: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    numberText: {
        fontSize: 28,
        fontWeight: '500',
    },
});
