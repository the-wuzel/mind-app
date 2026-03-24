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


type SingleMemoryItem =
    | { type: 'reflection', data: Reflection }
    | { type: 'gratitude', data: { id: number, content: string, date: string } }
    | { type: 'quote', data: { id: number, text: string, author: string, date: string } };

type MemoryItem =
    | { type: 'reflection', data: Reflection }
    | { type: 'gratitude_group', data: { id: string, date: string, items: { id: number, content: string, date: string }[] } }
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
    const [itemToDelete, setItemToDelete] = useState<SingleMemoryItem | null>(null);

    const totalEntries = useMemo(() => memories.reduce((acc, section) => {
        return acc + section.data.reduce((secAcc, item) => {
            if (item.type === 'gratitude_group') return secAcc + item.data.items.length;
            return secAcc + 1;
        }, 0);
    }, 0), [memories]);

    const groupMemories = (items: SingleMemoryItem[]) => {
        return items.reduce((acc, current) => {
            const dateStr = new Date(current.data.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            let section = acc.find(s => s.title === dateStr);
            if (!section) {
                section = { title: dateStr, data: [] };
                acc.push(section);
            }
            if (current.type === 'gratitude') {
                const existingGroup = section.data.find(item => item.type === 'gratitude_group') as Extract<MemoryItem, { type: 'gratitude_group' }> | undefined;
                if (existingGroup) {
                    existingGroup.data.items.push(current.data);
                } else {
                    section.data.push({
                        type: 'gratitude_group',
                        data: {
                            id: `gratitude-group-${current.data.id}`,
                            date: current.data.date,
                            items: [current.data]
                        }
                    });
                }
            } else {
                section.data.push(current as MemoryItem);
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

                const combined: SingleMemoryItem[] = [
                    ...reflections.map(r => ({ type: 'reflection' as const, data: r })),
                    ...gratitudes.map(g => ({ type: 'gratitude' as const, data: g })),
                    ...quotes.map(q => ({ type: 'quote' as const, data: q }))
                ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

                setMemories(groupMemories(combined));
            }
            loadMemories();
        }, [])
    );

    const handleDelete = (item: SingleMemoryItem) => {
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

            const combined: SingleMemoryItem[] = [
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
                        <View style={[styles.labelContainer, { backgroundColor: colors.primaryButton + '26' }]}>
                            <IconSymbol name="moon.fill" size={14} color={colors.primaryButton} />
                            <ThemedText style={styles.label}>Evening Reflection</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.prompt}>{item.data.prompt}</ThemedText>
                        <ThemedText style={styles.answer}>{item.data.answer}</ThemedText>
                    </ThemedView>
                </TouchableOpacity>
            );
        } else if (item.type === 'gratitude_group') {
            return (
                <ThemedView style={styles.card}>
                    <View style={[styles.labelContainer, { backgroundColor: colors.primaryButton + '26' }]}>
                        <IconSymbol name="heart.fill" size={14} color={colors.primaryButton} />
                        <ThemedText style={styles.label}>
                            {item.data.items.length > 1 ? 'Daily Gratitudes' : 'Daily Gratitude'}
                        </ThemedText>
                    </View>
                    <View style={styles.gratitudeList}>
                        {item.data.items.map((g) => (
                            <TouchableOpacity 
                                key={g.id} 
                                onLongPress={() => handleDelete({ type: 'gratitude', data: g })} 
                                activeOpacity={0.8}
                                style={styles.gratitudeItem}
                            >
                                {item.data.items.length > 1 && (
                                    <View style={[styles.bulletPoint, { backgroundColor: colors.textPrimary }]} />
                                )}
                                <ThemedText style={[styles.answer, { flex: 1 }]}>{g.content}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ThemedView>
            );
        } else {
            return (
                <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                    <ThemedView style={styles.card}>
                        <View style={[styles.labelContainer, { backgroundColor: colors.primaryButton + '26' }]}>
                            <IconSymbol name="quote.opening" size={14} color={colors.primaryButton} />
                            <ThemedText style={styles.label}>Quote of the Day</ThemedText>
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
        fontFamily: 'PlusJakartaSans-SemiBold',
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
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.cardBorder,
    },
    prompt: {
        marginBottom: 8,
        color: colors.textPrimary,
    },
    sectionHeader: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        marginTop: 24,
        marginBottom: 8,
        color: colors.textPrimary,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
        marginBottom: 12,
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Bold',
        color: colors.primaryButton,
    },
    answer: {
        opacity: 0.9,
        color: colors.textPrimary,
    },
    emptyContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    gratitudeList: {
        gap: 8,
    },
    gratitudeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 2,
    },
    bulletPoint: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
        opacity: 0.6,
    }
});
