import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
    title: "EasyStreet - SF Street Sweeping Parking Assistant",
    description:
        "Never get a street sweeping parking ticket again. View schedules, park smart.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50 text-gray-900 antialiased">
                <ConvexClientProvider>{children}</ConvexClientProvider>
            </body>
        </html>
    );
}
