import { describe, expect, it } from "vitest";
import {
	validateDuplicateNodeIds,
	validateEdgeReferences,
	validateNodeTypes,
	validateRequiredFields,
} from "../csv-validation";

describe("validateRequiredFields", () => {
	it("should detect missing node ID with specific node identification", () => {
		// Given: nodes array with node at index 1 missing 'id' field
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ title: "Node 2", type: "STEP" }, // missing id
			{ id: "node3", title: "Node 3", type: "OUTPUT" },
		];

		// When: validateRequiredFields(nodes, 'nodes') called
		const result = validateRequiredFields(nodes, "nodes");

		// Then: should return error with specific row and field identification
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "MISSING_REQUIRED_FIELD",
			severity: "critical",
			message: "Node at row 2 is missing required field: id",
			rowIndex: 1,
			field: "id",
			dataType: "nodes",
		});
	});

	it("should detect missing node title with row identification", () => {
		// Given: nodes array with node at index 0 having empty 'title' field
		const nodes = [
			{ id: "node1", title: "", type: "INPUT" }, // empty title
			{ id: "node2", title: "Node 2", type: "STEP" },
		];

		// When: validateRequiredFields called
		const result = validateRequiredFields(nodes, "nodes");

		// Then: should return error with rowIndex: 0, field: 'title'
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "MISSING_REQUIRED_FIELD",
			severity: "critical",
			message: "Node at row 1 is missing required field: title",
			rowIndex: 0,
			field: "title",
			dataType: "nodes",
		});
	});

	it("should detect missing edge source field", () => {
		// Given: edges array with edge at index 2 missing 'source' field
		const edges = [
			{ source: "node1", target: "node2" },
			{ source: "node2", target: "node3" },
			{ target: "node4" }, // missing source
		];

		// When: validateRequiredFields(edges, 'edges') called
		const result = validateRequiredFields(edges, "edges");

		// Then: should return error with message 'Edge at row 3 is missing required field: source'
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "MISSING_REQUIRED_FIELD",
			severity: "critical",
			message: "Edge at row 3 is missing required field: source",
			rowIndex: 2,
			field: "source",
			dataType: "edges",
		});
	});

	it("should detect missing edge target field", () => {
		// Given: edges array with edge missing 'target' field
		const edges = [
			{ source: "node1", target: "node2" },
			{ source: "node2" }, // missing target
		];

		// When: validateRequiredFields called
		const result = validateRequiredFields(edges, "edges");

		// Then: should return appropriate error with field identification
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "MISSING_REQUIRED_FIELD",
			severity: "critical",
			message: "Edge at row 2 is missing required field: target",
			rowIndex: 1,
			field: "target",
			dataType: "edges",
		});
	});

	it("should detect multiple missing fields in same data", () => {
		// Given: nodes with multiple missing required fields
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ title: "Node 2", type: "STEP" }, // missing id
			{ id: "node3", type: "OUTPUT" }, // missing title
		];

		// When: validateRequiredFields called
		const result = validateRequiredFields(nodes, "nodes");

		// Then: should return multiple errors
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0].message).toBe(
			"Node at row 2 is missing required field: id",
		);
		expect(result.errors[1].message).toBe(
			"Node at row 3 is missing required field: title",
		);
	});

	it("should return success when all required fields present", () => {
		// Given: valid nodes and edges with all required fields
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "STEP" },
		];
		const edges = [{ source: "node1", target: "node2" }];

		// When: validateRequiredFields called for both
		const nodeResult = validateRequiredFields(nodes, "nodes");
		const edgeResult = validateRequiredFields(edges, "edges");

		// Then: should return success for both
		expect(nodeResult.isValid).toBe(true);
		expect(nodeResult.errors).toHaveLength(0);
		expect(edgeResult.isValid).toBe(true);
		expect(edgeResult.errors).toHaveLength(0);
	});
});

describe("validateNodeTypes", () => {
	it("should detect invalid node type with specific node identification", () => {
		// Given: node at index 1 with type 'PROCESSING' (invalid)
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "PROCESSING" }, // invalid type
			{ id: "node3", title: "Node 3", type: "OUTPUT" },
		];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should return error with specific details
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "INVALID_NODE_TYPE",
			severity: "critical",
			message:
				"Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT",
			rowIndex: 1,
			invalidValue: "PROCESSING",
			validValues: ["INPUT", "STEP", "OUTPUT"],
			dataType: "nodes",
		});
	});

	it("should handle case-insensitive type validation", () => {
		// Given: node with type 'input' (lowercase)
		const nodes = [{ id: "node1", title: "Node 1", type: "input" }];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should normalize to 'INPUT' and pass validation
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
		// Note: The function should normalize the type internally
	});

	it("should handle mixed case types correctly", () => {
		// Given: nodes with various case combinations
		const nodes = [
			{ id: "node1", title: "Node 1", type: "Input" },
			{ id: "node2", title: "Node 2", type: "STEP" },
			{ id: "node3", title: "Node 3", type: "output" },
		];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should normalize all and pass validation
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should detect multiple invalid node types", () => {
		// Given: multiple nodes with invalid types
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "PROCESSING" }, // invalid
			{ id: "node3", title: "Node 3", type: "CALCULATION" }, // invalid
		];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should return multiple errors
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0].message).toBe(
			"Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT",
		);
		expect(result.errors[1].message).toBe(
			"Node at row 3 has invalid type: CALCULATION. Must be INPUT, STEP, or OUTPUT",
		);
	});

	it("should return success for valid node types", () => {
		// Given: nodes with types ['INPUT', 'STEP', 'OUTPUT']
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "STEP" },
			{ id: "node3", title: "Node 3", type: "OUTPUT" },
		];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle empty nodes array", () => {
		// Given: empty nodes array
		const nodes: any[] = [];

		// When: validateNodeTypes called
		const result = validateNodeTypes(nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe("validateDuplicateNodeIds", () => {
	it("should detect duplicate node IDs with all affected rows", () => {
		// Given: nodes with duplicate ID 'user-count' at rows 1 and 4
		const nodes = [
			{ id: "sessions", title: "Sessions", type: "INPUT" },
			{ id: "user-count", title: "User Count", type: "STEP" }, // row 2 (index 1)
			{ id: "orders", title: "Orders", type: "INPUT" },
			{ id: "revenue", title: "Revenue", type: "OUTPUT" },
			{ id: "user-count", title: "User Count Duplicate", type: "STEP" }, // row 5 (index 4)
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should return error with all affected rows
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "DUPLICATE_NODE_ID",
			severity: "critical",
			message: 'Duplicate node ID "user-count" found at rows: 2, 5',
			duplicateId: "user-count",
			rowIndexes: [1, 4],
			dataType: "nodes",
		});
	});

	it("should detect multiple sets of duplicates", () => {
		// Given: multiple duplicate IDs in dataset
		const nodes = [
			{ id: "users", title: "Users", type: "INPUT" },
			{ id: "orders", title: "Orders", type: "INPUT" }, // duplicate set 1
			{ id: "revenue", title: "Revenue", type: "OUTPUT" },
			{ id: "users", title: "Users Duplicate", type: "STEP" }, // duplicate set 2
			{ id: "orders", title: "Orders Duplicate", type: "STEP" }, // duplicate set 1
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should return separate error for each duplicate set
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(2);

		// Should have error for 'users' duplicates
		const usersError = result.errors.find((e) => e.duplicateId === "users");
		expect(usersError).toEqual({
			type: "DUPLICATE_NODE_ID",
			severity: "critical",
			message: 'Duplicate node ID "users" found at rows: 1, 4',
			duplicateId: "users",
			rowIndexes: [0, 3],
			dataType: "nodes",
		});

		// Should have error for 'orders' duplicates
		const ordersError = result.errors.find((e) => e.duplicateId === "orders");
		expect(ordersError).toEqual({
			type: "DUPLICATE_NODE_ID",
			severity: "critical",
			message: 'Duplicate node ID "orders" found at rows: 2, 5',
			duplicateId: "orders",
			rowIndexes: [1, 4],
			dataType: "nodes",
		});
	});

	it("should handle triple or more duplicates correctly", () => {
		// Given: three nodes with same ID
		const nodes = [
			{ id: "metric", title: "Metric 1", type: "INPUT" },
			{ id: "metric", title: "Metric 2", type: "STEP" },
			{ id: "metric", title: "Metric 3", type: "OUTPUT" },
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should list all three occurrences
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toEqual({
			type: "DUPLICATE_NODE_ID",
			severity: "critical",
			message: 'Duplicate node ID "metric" found at rows: 1, 2, 3',
			duplicateId: "metric",
			rowIndexes: [0, 1, 2],
			dataType: "nodes",
		});
	});

	it("should ignore nodes with empty or missing IDs", () => {
		// Given: nodes with some empty IDs (these should be caught by required fields validation)
		const nodes = [
			{ id: "valid-node", title: "Valid Node", type: "INPUT" },
			{ id: "", title: "Empty ID", type: "STEP" },
			{ title: "Missing ID", type: "OUTPUT" }, // no id field
			{ id: "another-valid", title: "Another Valid", type: "STEP" },
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should return success (empty IDs don't count as duplicates)
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should return success when all node IDs are unique", () => {
		// Given: nodes with all unique IDs
		const nodes = [
			{ id: "users", title: "Users", type: "INPUT" },
			{ id: "orders", title: "Orders", type: "INPUT" },
			{ id: "revenue", title: "Revenue", type: "OUTPUT" },
			{ id: "conversion", title: "Conversion Rate", type: "STEP" },
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle empty nodes array", () => {
		// Given: empty nodes array
		const nodes: any[] = [];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should be case-sensitive for node IDs", () => {
		// Given: nodes with IDs that differ only in case
		const nodes = [
			{ id: "Users", title: "Users Capitalized", type: "INPUT" },
			{ id: "users", title: "Users Lowercase", type: "INPUT" },
		];

		// When: validateDuplicateNodeIds called
		const result = validateDuplicateNodeIds(nodes);

		// Then: should treat as different IDs and return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe("validateEdgeReferences", () => {
	it("should detect orphaned edge with missing source node", () => {
		// Given: edge at row 2 with source 'missing-node' not in nodes (after computed ID processing)
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "OUTPUT" },
		];
		const edges = [
			{ source: "node1", target: "node2", computedSource: "node1", computedTarget: "node2" },
			{ source: "node2", target: "node1", computedSource: "node2", computedTarget: "node1" },
			{ source: "missing-node", target: "node2", computedSource: "missing-node", computedTarget: "node2" }, // row 3 (index 2)
		];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should return warning (not error) with specific details
		expect(result.isValid).toBe(true); // Warnings don't invalidate
		expect(result.errors).toHaveLength(0); // No critical errors
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toEqual({
			type: "UNMATCHED_EDGE_SOURCE",
			severity: "warning",
			message: "Edge at row 3 references unmatched source node: missing-node (computed: missing-node)",
			rowIndex: 2,
			field: "source",
			missingNodeId: "missing-node",
			dataType: "edges",
		});
	});

	it("should detect orphaned edge with missing target node", () => {
		// Given: edge with target node not found in nodes (after computed ID processing)
		const nodes = [
			{ id: "node1", title: "Node 1", type: "INPUT" },
			{ id: "node2", title: "Node 2", type: "OUTPUT" },
		];
		const edges = [
			{ source: "node1", target: "node2", computedSource: "node1", computedTarget: "node2" },
			{ source: "node1", target: "missing-target", computedSource: "node1", computedTarget: "missing-target" }, // row 2 (index 1)
		];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should return appropriate warning with target identification
		expect(result.isValid).toBe(true); // Warnings don't invalidate
		expect(result.errors).toHaveLength(0); // No critical errors
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toEqual({
			type: "UNMATCHED_EDGE_TARGET",
			severity: "warning",
			message: "Edge at row 2 references unmatched target node: missing-target (computed: missing-target)",
			rowIndex: 1,
			field: "target",
			missingNodeId: "missing-target",
			dataType: "edges",
		});
	});

	it("should detect multiple orphaned edges with different missing nodes", () => {
		// Given: multiple edges with various missing node references (after computed ID processing)
		const nodes = [{ id: "valid-node", title: "Valid Node", type: "INPUT" }];
		const edges = [
			{ source: "missing-source", target: "valid-node", computedSource: "missing-source", computedTarget: "valid-node" }, // row 1
			{ source: "valid-node", target: "missing-target", computedSource: "valid-node", computedTarget: "missing-target" }, // row 2
			{ source: "another-missing", target: "also-missing", computedSource: "another-missing", computedTarget: "also-missing" }, // row 3
		];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should return multiple warnings for all missing references
		expect(result.isValid).toBe(true); // Warnings don't invalidate
		expect(result.errors).toHaveLength(0); // No critical errors
		expect(result.warnings).toHaveLength(4);

		// Check specific warning messages
		expect(result.warnings[0].message).toBe(
			"Edge at row 1 references unmatched source node: missing-source (computed: missing-source)",
		);
		expect(result.warnings[1].message).toBe(
			"Edge at row 2 references unmatched target node: missing-target (computed: missing-target)",
		);
		expect(result.warnings[2].message).toBe(
			"Edge at row 3 references unmatched source node: another-missing (computed: another-missing)",
		);
		expect(result.warnings[3].message).toBe(
			"Edge at row 3 references unmatched target node: also-missing (computed: also-missing)",
		);
	});

	it("should return success when all edge references exist in nodes", () => {
		// Given: edges with all valid node references
		const nodes = [
			{ id: "input-node", title: "Input Node", type: "INPUT" },
			{ id: "step-node", title: "Step Node", type: "STEP" },
			{ id: "output-node", title: "Output Node", type: "OUTPUT" },
		];
		const edges = [
			{ source: "input-node", target: "step-node" },
			{ source: "step-node", target: "output-node" },
		];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle empty edges array", () => {
		// Given: empty edges array with some nodes
		const nodes = [{ id: "node1", title: "Node 1", type: "INPUT" }];
		const edges: any[] = [];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle edges with empty or missing source/target fields", () => {
		// Given: edges with some empty/missing references (these should be caught by required fields validation)
		const nodes = [{ id: "valid-node", title: "Valid Node", type: "INPUT" }];
		const edges = [
			{ source: "valid-node", target: "valid-node" },
			{ source: "", target: "valid-node" }, // empty source
			{ source: "valid-node" }, // missing target
			{ target: "valid-node" }, // missing source
		];

		// When: validateEdgeReferences called
		const result = validateEdgeReferences(edges, nodes);

		// Then: should ignore empty/missing references and return success for valid ones
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});
