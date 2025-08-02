import { describe, expect, it } from "vitest";
import { generateNodeIds, generateEdgeIds } from "../id-generation";

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
	
	it("should not process nodes with empty IDs", () => {
		const nodes = [
			{ id: "", type: "INPUT" },
			{ id: "valid-id", type: "OUTPUT" }
		];
		
		// Should only process valid nodes (empty IDs should be filtered out by validation)
		const result = generateNodeIds(nodes.filter(n => n.id && n.id.trim()));
		expect(result.nodes).toHaveLength(1);
		expect(result.nodes[0].id).toBe("valid-id");
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

});

describe("generateEdgeIds", () => {
	it("should slugify edge source and target IDs for matching", () => {
		const edges = [
			{ source: "User Count", target: "Total Revenue" },
			{ source: "Raw Data", target: "User Count" },
		];
		
		const result = generateEdgeIds(edges);
		
		expect(result[0]).toEqual({
			source: "User Count",
			target: "Total Revenue", 
			computedSource: "user-count",
			computedTarget: "total-revenue"
		});
		expect(result[1]).toEqual({
			source: "Raw Data",
			target: "User Count",
			computedSource: "raw-data", 
			computedTarget: "user-count"
		});
	});
	
	it("should handle empty or missing source/target values", () => {
		const edges = [
			{ source: "", target: "Revenue" },
			{ source: "Users", target: "   " },
			{ source: "Valid" }, // missing target
		];
		
		const result = generateEdgeIds(edges);
		
		expect(result[0].computedSource).toBe("");
		expect(result[0].computedTarget).toBe("revenue");
		expect(result[1].computedSource).toBe("users");
		expect(result[1].computedTarget).toBe("");
		expect(result[2].computedSource).toBe("valid");
		expect(result[2].computedTarget).toBe("");
	});

	it("should handle special characters in edge IDs", () => {
		const edges = [
			{ source: "Revenue ($USD)", target: "User % Growth" },
			{ source: "New Users (30-day)", target: "MRR / ARR Ratio" },
		];
		
		const result = generateEdgeIds(edges);
		
		expect(result[0]).toEqual({
			source: "Revenue ($USD)",
			target: "User % Growth",
			computedSource: "revenue-usd",
			computedTarget: "user-growth"
		});
		expect(result[1]).toEqual({
			source: "New Users (30-day)",
			target: "MRR / ARR Ratio",
			computedSource: "new-users-30-day",
			computedTarget: "mrr-arr-ratio"
		});
	});

	it("should preserve all original edge properties", () => {
		const edges = [
			{
				source: "Input Data",
				target: "Processed Output",
				edgeType: "transformation",
				weight: 0.8,
				customProperty: "value123"
			},
		];
		
		const result = generateEdgeIds(edges);
		
		expect(result[0]).toEqual({
			source: "Input Data",
			target: "Processed Output",
			computedSource: "input-data",
			computedTarget: "processed-output",
			edgeType: "transformation",
			weight: 0.8,
			customProperty: "value123"
		});
	});

	it("should handle case-insensitive computation", () => {
		const edges = [
			{ source: "user count", target: "TOTAL REVENUE" },
			{ source: "User Count", target: "Total Revenue" },
		];
		
		const result = generateEdgeIds(edges);
		
		// Both should produce the same computed IDs (case-insensitive)
		expect(result[0].computedSource).toBe("user-count");
		expect(result[0].computedTarget).toBe("total-revenue");
		expect(result[1].computedSource).toBe("user-count");
		expect(result[1].computedTarget).toBe("total-revenue");
	});
});