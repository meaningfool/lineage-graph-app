import { describe, expect, it } from "vitest";
import {
	validateRequiredFields,
	validateNodeTypes,
	validateEdgeReferences,
} from "../csv-validation";
import { generateNodeIds, generateEdgeIds } from "../id-generation";
import { validateNodeConnectivity } from "../graph-structure-validation";

describe("Complete CSV Validation Pipeline", () => {
	it("should run all 4 validation stages in correct order", () => {
		// Test: Raw Data → Processing → Processed Data → Graph Structure
		
		// Stage 1: Raw Data Validation
		const rawNodes = [
			{ id: "users", title: "Users", type: "INPUT" },
			{ id: "revenue", title: "Revenue", type: "OUTPUT" },
		];
		const rawEdges = [
			{ source: "users", target: "revenue" },
		];

		// Raw data validation should pass
		const rawNodesValidation = validateRequiredFields(rawNodes, "nodes");
		const rawEdgesValidation = validateRequiredFields(rawEdges, "edges");
		const nodeTypesValidation = validateNodeTypes(rawNodes);

		expect(rawNodesValidation.isValid).toBe(true);
		expect(rawEdgesValidation.isValid).toBe(true);
		expect(nodeTypesValidation.isValid).toBe(true);

		// Stage 2: Data Processing
		const nodeGenResult = generateNodeIds(rawNodes);
		const processedNodes = nodeGenResult.nodes;
		const processedEdges = generateEdgeIds(rawEdges);

		expect(processedNodes).toHaveLength(2);
		expect(processedEdges).toHaveLength(1);

		// Stage 3: Processed Data Validation
		const edgeReferencesValidation = validateEdgeReferences(processedEdges, processedNodes);
		expect(edgeReferencesValidation.isValid).toBe(true);

		// Stage 4: Graph Structure Validation
		const graphValidation = validateNodeConnectivity(processedNodes, processedEdges);
		expect(graphValidation.isValid).toBe(true);
	});

	it("should stop at stage 1 for critical+blocking errors", () => {
		// Test missing required columns stops pipeline
		const emptyNodes: any[] = [];
		const emptyEdges: any[] = [];

		// Stage 1: Raw Data Validation should fail with blocking error
		const rawNodesValidation = validateRequiredFields(emptyNodes, "nodes");
		
		expect(rawNodesValidation.isValid).toBe(false);
		expect(rawNodesValidation.severity).toBe("critical");
		expect(rawNodesValidation.blocking).toBe(true);

		// Pipeline should stop here - don't proceed to processing
		// In real implementation, this would prevent generateNodeIds from being called
	});

	it("should filter problematic items and continue for non-critical errors", () => {
		// Test empty IDs, invalid types get dropped but pipeline continues
		const problematicNodes = [
			{ id: "", title: "Empty ID", type: "INPUT" }, // Will be dropped
			{ id: "valid", title: "Valid", type: "INPUT" }, // Will be processed
			{ id: "invalid-type", title: "Invalid", type: "WRONG" }, // Will be dropped
		];

		// Stage 1: Raw Data Validation finds non-critical errors
		const rawValidation = validateRequiredFields(problematicNodes, "nodes");
		const typeValidation = validateNodeTypes(problematicNodes);

		expect(rawValidation.isValid).toBe(false);
		expect(rawValidation.severity).toBe("non-critical");
		expect(rawValidation.blocking).toBe(false);

		expect(typeValidation.isValid).toBe(false);
		expect(typeValidation.severity).toBe("non-critical");
		expect(typeValidation.blocking).toBe(false);

		// Stage 2: Filter out problematic items before processing
		const validNodes = problematicNodes.filter(node => 
			node.id && node.id.trim() && 
			["INPUT", "STEP", "OUTPUT"].includes(node.type?.toUpperCase())
		);

		expect(validNodes).toHaveLength(1);
		expect(validNodes[0].id).toBe("valid");

		// Stage 2: Process only valid items
		const nodeGenResult = generateNodeIds(validNodes);
		expect(nodeGenResult.nodes).toHaveLength(1);
		expect(nodeGenResult.nodes[0].id).toBe("valid");
	});

	it("should aggregate all errors and warnings from all stages", () => {
		// Test complete error collection and categorization
		const nodes = [
			{ id: "", title: "Empty ID", type: "INPUT" }, // Raw validation error
			{ id: "valid", title: "Valid", type: "INVALID_TYPE" }, // Type validation error
		];
		const edges = [
			{ source: "missing", target: "valid" }, // Edge reference warning
		];

		// Stage 1: Raw Data Validation
		const rawValidation = validateRequiredFields(nodes, "nodes");
		const typeValidation = validateNodeTypes(nodes);

		// Should collect raw validation errors
		expect(rawValidation.errors).toHaveLength(1);
		expect(rawValidation.errors[0].message).toContain("missing required field: id");
		
		expect(typeValidation.errors).toHaveLength(1);
		expect(typeValidation.errors[0].message).toContain("invalid type: INVALID_TYPE");

		// Stage 2: Process valid items only
		const validNodes = nodes.filter(node => 
			node.id && node.id.trim() && 
			["INPUT", "STEP", "OUTPUT"].includes(node.type?.toUpperCase())
		);
		// No valid nodes remain after filtering
		expect(validNodes).toHaveLength(0);

		// If we had valid nodes, we would continue with edge processing
		// For this test, we'll simulate with minimal valid data
		const minimalNodes = [{ id: "test", title: "Test", type: "INPUT" }];
		const processedNodes = generateNodeIds(minimalNodes).nodes;
		const processedEdges = generateEdgeIds(edges);

		// Stage 3: Processed Data Validation
		const edgeValidation = validateEdgeReferences(processedEdges, processedNodes);
		
		// Should collect edge reference warnings
		expect(edgeValidation.isValid).toBe(true); // Warnings don't invalidate
		expect(edgeValidation.warnings).toHaveLength(2); // Missing source and target
	});

	it("should block import for graph structure violations", () => {
		// Test non-critical+blocking graph errors prevent final import
		const nodes = [
			{ id: "orphaned", title: "Orphaned Step", type: "STEP" }, // Isolated STEP node
		];
		const edges: any[] = []; // No edges

		// Stages 1-2: Process data successfully
		const processedNodes = generateNodeIds(nodes).nodes;
		const processedEdges = generateEdgeIds(edges);

		// Stage 4: Graph Structure Validation should find blocking errors
		const graphValidation = validateNodeConnectivity(processedNodes, processedEdges);

		expect(graphValidation.isValid).toBe(false);
		expect(graphValidation.severity).toBe("non-critical"); // Individual node issue
		expect(graphValidation.blocking).toBe(true); // But blocks import
		expect(graphValidation.errors).toHaveLength(1);
		expect(graphValidation.errors[0].message).toContain("has no incoming or outgoing connections");
	});

	it("should handle complex pipeline with multiple error types", () => {
		// Test realistic scenario with various validation issues
		const nodes = [
			{ id: "", title: "Empty", type: "INPUT" }, // Raw error (drop)
			{ id: "valid-input", title: "Input", type: "INPUT" }, // Valid
			{ id: "step", title: "Step", type: "STEP" }, // Valid but will be isolated
			{ id: "output", title: "Output", type: "OUTPUT" }, // Valid
			{ id: "duplicate", title: "Dup1", type: "INPUT" }, // Valid
			{ id: "duplicate", title: "Dup2", type: "OUTPUT" }, // Duplicate (drop second)
		];
		const edges = [
			{ source: "valid-input", target: "output" }, // Valid
			{ source: "missing", target: "output" }, // Missing reference (warning)
		];

		// Stage 1: Raw Data Validation
		const rawValidation = validateRequiredFields(nodes, "nodes");
		expect(rawValidation.isValid).toBe(false);
		expect(rawValidation.errors).toHaveLength(1); // Empty ID

		// Stage 2: Data Processing with filtering
		const validNodes = nodes.filter(node => 
			node.id && node.id.trim() && 
			["INPUT", "STEP", "OUTPUT"].includes(node.type?.toUpperCase())
		);
		expect(validNodes).toHaveLength(5); // Filtered out empty ID

		const nodeGenResult = generateNodeIds(validNodes);
		expect(nodeGenResult.nodes).toHaveLength(4); // Duplicate removed
		expect(nodeGenResult.duplicatesRemoved).toBe(1);

		const processedEdges = generateEdgeIds(edges);

		// Stage 3: Processed Data Validation
		const edgeValidation = validateEdgeReferences(processedEdges, nodeGenResult.nodes);
		expect(edgeValidation.warnings).toHaveLength(1); // Missing reference

		// Stage 4: Graph Structure Validation
		const graphValidation = validateNodeConnectivity(nodeGenResult.nodes, processedEdges);
		expect(graphValidation.isValid).toBe(false); // Isolated step node
		expect(graphValidation.blocking).toBe(true);

		// Final assessment: Multiple non-blocking errors + one blocking error
		const hasBlockingErrors = 
			rawValidation.blocking || 
			edgeValidation.blocking || 
			graphValidation.blocking;
		
		expect(hasBlockingErrors).toBe(true); // Should block import
	});
});