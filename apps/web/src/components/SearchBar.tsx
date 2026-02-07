"use client";

import { useState, useCallback } from "react";
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
        <div className="absolute left-4 top-4 z-10 w-80">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search streets..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {isOpen && results && results.length > 0 && (
                <div className="mt-1 max-h-64 overflow-y-auto rounded-xl bg-white shadow-xl">
                    {results.map((result: { _id: string; segmentId: string; streetName: string; limits: string }) => (
                        <button
                            key={result._id}
                            onClick={() => handleSelect(result.segmentId)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50"
                        >
                            <p className="font-medium text-gray-900">
                                {result.streetName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {result.limits}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
