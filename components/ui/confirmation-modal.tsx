import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmationModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel"
}: ConfirmationModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const backgroundColor = useThemeColor({}, 'background');

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.centeredView}>
                    <TouchableWithoutFeedback>
                        <ThemedView style={styles.modalView}>
                            <ThemedText type="subtitle" style={styles.modalTitle}>{title}</ThemedText>
                            <ThemedText style={styles.modalText}>{message}</ThemedText>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: Colors[colorScheme].iconTertiary + '20' }]}
                                    onPress={onClose}
                                >
                                    <ThemedText style={{ color: Colors[colorScheme].text }}>{cancelText}</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: Colors[colorScheme].deleteIcon }]}
                                    onPress={onConfirm}
                                >
                                    <ThemedText style={styles.textStyle}>{confirmText}</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </ThemedView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        borderRadius: 12,
        padding: 12,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textStyle: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
    },
});
