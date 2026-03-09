import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { deleteGratitude, deleteReflection, getGratitudes, getReflections, getSavedQuotes, Reflection, removeSavedQuote } from '@/services/database';

import { Colors } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';


type MemoryItem =
    | { type: 'reflection', data: Reflection }
    | { type: 'gratitude', data: { id: number, content: string, date: string } }
    | { type: 'quote', data: { id: number, text: string, author: string, date: string } };

type SectionData = { title: string; data: MemoryItem[] };

export default function MemoriesScreen() {
    const [memories, setMemories] = useState<SectionData[]>([]);
    const { primaryColor } = useSettings();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
        tint: primaryColor,
        tabIconSelected: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MemoryItem | null>(null);

    const totalEntries = useMemo(() => memories.reduce((acc, section) => acc + section.data.length, 0), [memories]);

    const groupMemories = (items: MemoryItem[]) => {
        return items.reduce((acc, current) => {
            const dateStr = new Date(current.data.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const section = acc.find(s => s.title === dateStr);
            if (section) {
                section.data.push(current);
            } else {
                acc.push({ title: dateStr, data: [current] });
            }
            return acc;
        }, [] as SectionData[]);
    };

    useFocusEffect(
        useCallback(() => {
            async function loadMemories() {
                const [reflections, gratitudes, quotes] = await Promise.all([
                    getReflections(),
                    getGratitudes(),
                    getSavedQuotes()
                ]);

                const combined: MemoryItem[] = [
                    ...reflections.map(r => ({ type: 'reflection' as const, data: r })),
                    ...gratitudes.map(g => ({ type: 'gratitude' as const, data: g })),
                    ...quotes.map(q => ({ type: 'quote' as const, data: q }))
                ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

                setMemories(groupMemories(combined));
            }
            loadMemories();
        }, [])
    );

    const handleDelete = (item: MemoryItem) => {
        setItemToDelete(item);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'reflection') {
                await deleteReflection(itemToDelete.data.id);
            } else if (itemToDelete.type === 'gratitude') {
                await deleteGratitude(itemToDelete.data.id);
            } else if (itemToDelete.type === 'quote') {
                await removeSavedQuote(itemToDelete.data.text, itemToDelete.data.author);
            }

            // Refresh functionality
            const [reflections, gratitudes, quotes] = await Promise.all([
                getReflections(),
                getGratitudes(),
                getSavedQuotes()
            ]);

            const combined: MemoryItem[] = [
                ...reflections.map(r => ({ type: 'reflection' as const, data: r })),
                ...gratitudes.map(g => ({ type: 'gratitude' as const, data: g })),
                ...quotes.map(q => ({ type: 'quote' as const, data: q }))
            ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

            setMemories(groupMemories(combined));
        } catch (error) {
            console.error("Failed to delete item:", error);
            Alert.alert("Error", "Failed to delete item.");
        } finally {
            setDeleteModalVisible(false);
            setItemToDelete(null);
        }
    };

    const renderItem = ({ item }: { item: MemoryItem }) => {
        if (item.type === 'reflection') {
            return (
                <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                    <ThemedView style={styles.card}>
                        <View style={styles.labelContainer}>
                            <ThemedText type="subtitle" style={styles.label}>Evening Reflection</ThemedText>
                            <IconSymbol name="moon.fill" size={16} color={colors.primaryButton} />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.prompt}>{item.data.prompt}</ThemedText>
                        <ThemedText style={styles.answer}>{item.data.answer}</ThemedText>
                    </ThemedView>
                </TouchableOpacity>
            );
        } else if (item.type === 'gratitude') {
            return (
                <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                    <ThemedView style={styles.card}>
                        <View style={styles.labelContainer}>
                            <ThemedText type="subtitle" style={styles.label}>Daily Gratitude</ThemedText>
                            <IconSymbol name="heart.fill" size={16} color={colors.primaryButton} />
                        </View>
                        <ThemedText style={styles.answer}>{item.data.content}</ThemedText>
                    </ThemedView>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                    <ThemedView style={styles.card}>
                        <View style={styles.labelContainer}>
                            <ThemedText type="subtitle" style={styles.label}>Quote of the Day</ThemedText>
                            <IconSymbol name="quote.opening" size={16} color={colors.primaryButton} />
                        </View>
                        <ThemedText style={styles.answer}>"{item.data.text}"</ThemedText>
                        <ThemedText style={[styles.answer, { marginTop: 4, fontStyle: 'italic', opacity: 0.7 }]}>- {item.data.author}</ThemedText>
                    </ThemedView>
                </TouchableOpacity>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerContainer}>
                    <ThemedText type="title">Memories</ThemedText>
                    <ThemedText style={styles.statsText}>
                        {totalEntries} {totalEntries === 1 ? 'Entry' : 'Entries'}
                    </ThemedText>
                </View>

                <SectionList
                    sections={memories}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
                    )}
                    keyExtractor={(item) => `${item.type}-${item.data.id}`}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <ThemedView style={styles.emptyContainer}>
                            <ThemedText>No memories saved yet.</ThemedText>
                        </ThemedView>
                    }
                />

                <ConfirmationModal
                    visible={deleteModalVisible}
                    onClose={() => {
                        setDeleteModalVisible(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Memory"
                    message="Are you sure you want to delete this memory?"
                    confirmText="Delete"
                    cancelText="Cancel"
                />
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
    statsText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        opacity: 0.8,
    },
    listContent: {
        paddingHorizontal: 32,
        gap: 16,
        paddingBottom: 32,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
    },
    prompt: {
        marginBottom: 8,
        color: colors.textPrimary,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 8,
        color: colors.textPrimary,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primaryButton,
    },
    answer: {
        opacity: 0.9,
        color: colors.textPrimary,
    },
    emptyContainer: {
        marginTop: 20,
        alignItems: 'center',
    }
});
