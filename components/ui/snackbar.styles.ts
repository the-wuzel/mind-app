import { Colors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

export const createStyles = (theme: 'light' | 'dark', colors: typeof Colors.light, insets: EdgeInsets) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: insets.top + 10,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.snackbarBackground,
        borderRadius: 12,
        padding: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Keep subtle border for dark bg
        overflow: 'hidden',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'transparent',
    },
    message: {
        color: '#fff', // Always white on dark snackbar
        fontSize: 16,
        fontWeight: '500',
    },
    undoButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(10, 126, 164, 0.1)', // Could be parameterized if strictly needed
        borderRadius: 8,
    },
    undoText: {
        color: colors.primaryButton,
        fontSize: 16,
        fontWeight: '600',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: colors.primaryButton,
        opacity: 0.8,
    },
});
