import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    compiler: {
        // Remove data-testid attributes from production builds
        reactRemoveProperties: { properties: ["^data-testid$"] },
    },
};

export default nextConfig;
