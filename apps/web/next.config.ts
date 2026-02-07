import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@repo/shared", "@repo/backend"],
};

export default nextConfig;
