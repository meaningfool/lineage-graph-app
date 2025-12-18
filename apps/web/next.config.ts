import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	compiler: {
		// Remove data-testid attributes from production builds only
		// In development, keep them for Playwright E2E tests
		reactRemoveProperties:
			process.env.NODE_ENV === "production"
				? { properties: ["^data-testid$"] }
				: false,
	},
	output: "export",
	trailingSlash: true,
};

export default nextConfig;
