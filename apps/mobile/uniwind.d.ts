/**
 * Type augmentation for Uniwind className prop on React Native components.
 * At build time, Uniwind transforms className props to style objects.
 * This declaration enables TypeScript to accept className props at compile time.
 */
import "react-native";

declare module "react-native" {
    interface ViewProps {
        className?: string;
    }
    interface TextProps {
        className?: string;
    }
    interface ImageProps {
        className?: string;
    }
    interface ScrollViewProps {
        className?: string;
    }
    interface TextInputProps {
        className?: string;
    }
    interface TouchableOpacityProps {
        className?: string;
    }
    interface PressableProps {
        className?: string;
    }
    interface FlatListProps<ItemT> {
        className?: string;
    }
    interface ModalProps {
        className?: string;
    }
}

declare module "react-native-safe-area-context" {
    interface NativeSafeAreaViewProps {
        className?: string;
    }
}
