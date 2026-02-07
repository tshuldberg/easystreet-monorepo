"use client";

import { DISCLAIMER_TEXT } from "@repo/shared";

interface DisclaimerModalProps {
    onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-3 text-xl font-bold text-gray-900">
                    Disclaimer
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">
                    {DISCLAIMER_TEXT}
                </p>
                <button
                    onClick={onAccept}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    I Understand
                </button>
            </div>
        </div>
    );
}
