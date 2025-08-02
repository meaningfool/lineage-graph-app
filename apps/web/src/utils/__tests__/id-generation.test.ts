import { describe, expect, it } from "vitest";
import { generateNodeIds } from "../id-generation";

describe("generateNodeIds - ID-based generation", () => {
	it("should generate IDs from user ID field using slugify", () => {
		const nodes = [
			{ id: "User Count", type: "INPUT" },
			{ id: "Total Revenue", type: "OUTPUT" },
			{ id: "Average Order Value", type: "STEP" },
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result.nodes[0]).toHaveProperty("id", "user-count");
		expect(result.nodes[0]).toHaveProperty("originalId", "User Count");
		expect(result.nodes[1]).toHaveProperty("id", "total-revenue");
		expect(result.nodes[2]).toHaveProperty("id", "average-order-value");
		expect(result.duplicatesRemoved).toBe(0);
		expect(result.message).toBe("");
	});
	
	it("should handle duplicate user IDs by keeping first, dropping subsequent", () => {
		const nodes = [
			{ id: "User Count", type: "INPUT" },
			{ id: "User Count", type: "OUTPUT" }, // Duplicate - should be dropped
			{ id: "Revenue", type: "STEP" },
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result.nodes).toHaveLength(2); // Second one dropped
		expect(result.nodes[0]).toHaveProperty("id", "user-count");
		expect(result.nodes[1]).toHaveProperty("id", "revenue");
		expect(result.duplicatesRemoved).toBe(1);
		expect(result.message).toBe("Removed 1 duplicate node");
	});
	
	it("should handle special characters and spaces in user IDs", () => {
		const nodes = [
			{ id: "Revenue ($USD)", type: "OUTPUT" },
			{ id: "User % Growth", type: "STEP" },
			{ id: "New Users (30-day)", type: "INPUT" },
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result.nodes[0]).toHaveProperty("id", "revenue-usd");
		expect(result.nodes[0]).toHaveProperty("originalId", "Revenue ($USD)");
		expect(result.nodes[1]).toHaveProperty("id", "user-growth");
		expect(result.nodes[2]).toHaveProperty("id", "new-users-30-day");
	});
	
	it("should handle empty or missing user IDs gracefully", () => {
		const nodes = [
			{ id: "", type: "INPUT" },
			{ id: "   ", type: "STEP" },
			{ type: "OUTPUT" } as any, // missing id
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result.nodes[0]).toHaveProperty("id", "node-1");
		expect(result.nodes[1]).toHaveProperty("id", "node-2");
		expect(result.nodes[2]).toHaveProperty("id", "node-3");
	});

	it("should handle case-insensitive duplicate detection", () => {
		const nodes = [
			{ id: "user count", type: "INPUT" },
			{ id: "User Count", type: "STEP" }, // Different case - still duplicate
			{ id: "USER COUNT", type: "OUTPUT" }, // Different case - still duplicate
		];
		
		const result = generateNodeIds(nodes);
		
		// Only first one should be kept
		expect(result.nodes).toHaveLength(1);
		expect(result.nodes[0]).toHaveProperty("id", "user-count");
		expect(result.nodes[0]).toHaveProperty("originalId", "user count");
		expect(result.duplicatesRemoved).toBe(2);
		expect(result.message).toBe("Removed 2 duplicate nodes");
	});

	it("should preserve all original node properties", () => {
		const nodes = [
			{
				id: "Monthly Active Users",
				type: "INPUT",
				title: "MAU Metric",
				description: "Number of unique users per month",
				owner: "Analytics Team",
				customField: "value123",
			},
		];
		
		const result = generateNodeIds(nodes);
		
		// Should preserve all properties and add computed ones
		expect(result.nodes[0]).toHaveProperty("id", "monthly-active-users");
		expect(result.nodes[0]).toHaveProperty("originalId", "Monthly Active Users");
		expect(result.nodes[0]).toHaveProperty("title", "MAU Metric");
		expect(result.nodes[0]).toHaveProperty("type", "INPUT");
		expect(result.nodes[0]).toHaveProperty("description", "Number of unique users per month");
		expect(result.nodes[0]).toHaveProperty("owner", "Analytics Team");
		expect(result.nodes[0]).toHaveProperty("customField", "value123");
	});

	it("should handle many duplicates correctly", () => {
		const nodes = [
			{ id: "User Count", type: "INPUT" },
			{ id: "Revenue", type: "OUTPUT" },
			{ id: "User Count", type: "STEP" }, // Duplicate
			{ id: "Revenue", type: "STEP" }, // Duplicate
			{ id: "user-count", type: "OUTPUT" }, // Duplicate (after slugification)
			{ id: "Orders", type: "INPUT" },
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result.nodes).toHaveLength(3); // Only unique ones kept
		expect(result.nodes[0]).toHaveProperty("id", "user-count");
		expect(result.nodes[1]).toHaveProperty("id", "revenue");
		expect(result.nodes[2]).toHaveProperty("id", "orders");
		expect(result.duplicatesRemoved).toBe(3);
		expect(result.message).toBe("Removed 3 duplicate nodes");
	});

	it("should return proper structure for no duplicates case", () => {
		const nodes = [
			{ id: "Users", type: "INPUT" },
			{ id: "Revenue", type: "OUTPUT" },
			{ id: "Orders", type: "STEP" },
		];
		
		const result = generateNodeIds(nodes);
		
		expect(result).toHaveProperty("nodes");
		expect(result).toHaveProperty("duplicatesRemoved", 0);
		expect(result).toHaveProperty("message", "");
		expect(result.nodes).toHaveLength(3);
	});

	it("should handle fallback ID conflicts with existing node IDs", () => {
		const nodes = [
			{ id: "node-1", type: "INPUT" }, // Conflicts with fallback pattern
			{ id: "", type: "STEP" }, // Will need fallback (becomes node-2)
			{ id: "node-2", type: "OUTPUT" }, // This is a duplicate!
			{ id: "   ", type: "STEP" }, // Will need fallback (becomes node-3)
			{ id: "valid", type: "INPUT" },
		];
		
		const result = generateNodeIds(nodes);
		
		// node-2 (3rd entry) should be dropped as duplicate
		expect(result.nodes).toHaveLength(4);
		expect(result.nodes[0]).toHaveProperty("id", "node-1");
		expect(result.nodes[1]).toHaveProperty("id", "node-2"); // From empty ID
		expect(result.nodes[2]).toHaveProperty("id", "node-3"); // From whitespace ID
		expect(result.nodes[3]).toHaveProperty("id", "valid");
		expect(result.duplicatesRemoved).toBe(1);
	});
});