import { MAP_COLORS } from "@repo/shared";

export function Legend() {
    const items = [
        { color: MAP_COLORS.red, label: "Sweeping today" },
        { color: MAP_COLORS.orange, label: "Tomorrow" },
        { color: MAP_COLORS.yellow, label: "2-3 days" },
        { color: MAP_COLORS.green, label: "No sweeping soon" },
        { color: MAP_COLORS.gray, label: "No data" },
    ];

    return (
        <div className="absolute right-4 top-4 z-10 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Legend
            </p>
            <div className="space-y-1.5">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div
                            className="h-3 w-6 rounded-sm"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-600">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
