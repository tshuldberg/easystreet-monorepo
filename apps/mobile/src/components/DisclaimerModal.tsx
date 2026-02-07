import { View, Text, Pressable, Modal } from "react-native";
import { DISCLAIMER_TEXT } from "@repo/shared";

interface DisclaimerModalProps {
    onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
    return (
        <Modal transparent animationType="fade">
            <View className="flex-1 items-center justify-center bg-black/50 p-6">
                <View className="w-full max-w-sm rounded-2xl bg-white p-6">
                    <Text className="mb-3 text-xl font-bold text-gray-900">
                        Disclaimer
                    </Text>
                    <Text className="mb-5 text-sm leading-relaxed text-gray-600">
                        {DISCLAIMER_TEXT}
                    </Text>
                    <Pressable
                        onPress={onAccept}
                        className="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700"
                    >
                        <Text className="text-center font-semibold text-white">
                            I Understand
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
