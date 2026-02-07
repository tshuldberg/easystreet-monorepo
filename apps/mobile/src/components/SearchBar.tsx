import { useState, useCallback } from "react";
import { View, TextInput, Pressable, Text, FlatList } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";

interface SearchBarProps {
    onSelect: (segmentId: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const results = useQuery(
        api.streets.searchStreets,
        query.trim().length > 0 ? { query: query.trim() } : "skip",
    );

    const handleSelect = useCallback(
        (segmentId: string) => {
            setQuery("");
            setIsOpen(false);
            onSelect(segmentId);
        },
        [onSelect],
    );

    return (
        <View className="z-10">
            <TextInput
                value={query}
                onChangeText={(text) => {
                    setQuery(text);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search streets..."
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
            />
            {isOpen && results && results.length > 0 && (
                <View className="mt-1 max-h-64 rounded-xl bg-white shadow-xl">
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => handleSelect(item.segmentId)}
                                className="border-b border-gray-50 px-4 py-3 active:bg-gray-50"
                            >
                                <Text className="font-medium text-gray-900">
                                    {item.streetName}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    {item.limits}
                                </Text>
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </View>
    );
}
