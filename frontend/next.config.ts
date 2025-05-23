import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    allowedDevOrigins: ["http://localhost:3000", "http://localhost:8080"],

    eslint: {
        ignoreDuringBuilds: true,
    },

};

export default nextConfig;
