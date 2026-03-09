import { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ColorPalette, Colors } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
    const {
        showDailyQuote,
        setShowDailyQuote,
        showMorningRoutine,
        setShowMorningRoutine,
        showEveningReflection,
        setShowEveningReflection,
        showDailyGratitude,
        setShowDailyGratitude,
        primaryColor,
        primaryColorIndex,
        setPrimaryColorIndex,
    } = useSettings();
    const colorScheme = useColorScheme() ?? 'light';

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);

    const activeThumbColor = primaryColor;
    const activeTrackColor = '#ddd';
    const trackColor = { false: '#767577', true: activeTrackColor };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerContainer}>
                    <ThemedText type="title">Settings</ThemedText>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedView style={styles.contentContainer}>
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
                            <ThemedView style={styles.card}>
                                <View style={styles.colorPaletteContainer}>
                                    {ColorPalette.map((color, index) => {
                                        const isSelected = primaryColorIndex === index;
                                        return (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setPrimaryColorIndex(index)}
                                                style={styles.colorOptionContainer}
                                            >
                                                {isSelected && (
                                                    <View style={[
                                                        styles.colorOptionRing,
                                                        { borderColor: color },
                                                    ]} />
                                                )}
                                                <View style={[
                                                    styles.colorOptionInner,
                                                    { backgroundColor: color },
                                                ]} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Morning</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => setShowDailyQuote(!showDailyQuote)}
                                >
                                    <ThemedText style={styles.label}>Daily Quote</ThemedText>
                                    <Switch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setShowDailyQuote}
                                        value={showDailyQuote}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => setShowMorningRoutine(!showMorningRoutine)}
                                >
                                    <ThemedText style={styles.label}>Morning Routine</ThemedText>
                                    <Switch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setShowMorningRoutine}
                                        value={showMorningRoutine}
                                    />
                                </TouchableOpacity>
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Evening</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => setShowEveningReflection(!showEveningReflection)}
                                >
                                    <ThemedText style={styles.label}>Evening Reflection</ThemedText>
                                    <Switch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setShowEveningReflection}
                                        value={showEveningReflection}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => setShowDailyGratitude(!showDailyGratitude)}
                                >
                                    <ThemedText style={styles.label}>Daily Gratitude</ThemedText>
                                    <Switch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setShowDailyGratitude}
                                        value={showDailyGratitude}
                                    />
                                </TouchableOpacity>
                            </ThemedView>
                        </View>
                    </ThemedView>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

export const createStyles = (theme: 'light' | 'dark', colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 32,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 32,
        paddingBottom: 32,
    },
    contentContainer: {
        gap: 32,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: colors.textPrimary,
        opacity: 0.9,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: colors.textPrimary,
        opacity: 0.9,
    },
    colorPaletteContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOptionContainer: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionRing: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
    },
    colorOptionInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
});

