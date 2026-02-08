import { useState, useCallback, useMemo } from "react";
import {
    View,
    TextInput,
    Pressable,
    Text,
    FlatList,
    Platform,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";

interface SearchBarProps {
    onSelect: (segmentId: string) => void;
    localCandidates?: Array<{
        segmentId: string;
        streetName: string;
        limits?: string;
    }>;
}

export function SearchBar({
    onSelect,
    localCandidates = [],
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const results = useQuery(
        api.streets.searchStreets,
        query.trim().length > 0 ? { query: query.trim() } : "skip",
    );

    const localResults = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return [];
        return localCandidates
            .filter((street) =>
                street.streetName.toLowerCase().includes(term),
            )
            .slice(0, 12);
    }, [localCandidates, query]);

    const displayResults =
        results && results.length > 0 ? results : localResults;

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
            <View className="flex-row items-center rounded-2xl border border-white/80 bg-white/95 px-3 py-1 shadow-lg">
                <Text className="mr-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Find
                </Text>
                <TextInput
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search San Francisco streets"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-2.5 text-[16px] text-gray-900"
                    returnKeyType="search"
                    clearButtonMode={
                        Platform.OS === "ios" ? "while-editing" : "never"
                    }
                />
            </View>
            {isOpen && displayResults.length > 0 && (
                <View className="mt-2 max-h-72 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-xl">
                    <FlatList
                        data={displayResults}
                        keyExtractor={(item) => item.segmentId}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => handleSelect(item.segmentId)}
                                className="border-b border-gray-100 px-4 py-3 active:bg-gray-50"
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
