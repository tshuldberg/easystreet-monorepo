import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.resolve(__dirname, "../.."),
    transpilePackages: ["@repo/shared", "@repo/backend"],
};

export default nextConfig;
