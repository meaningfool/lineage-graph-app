import { describe, expect, it } from "vitest";
import { validateNodeConnectivity } from "./graph-structure-validation";

describe("validateNodeConnectivity", () => {
	it("should detect INPUT nodes without outgoing edges", () => {
		// Given: INPUT node with no outgoing edges in edge list
		const nodes = [
			{ id: "raw-data", title: "Raw Data", type: "INPUT" },
			{ id: "processed", title: "Processed Data", type: "STEP" },
		];
		const edges = [{ source: "processed", target: "final" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return warning for INPUT node with no outgoing connections
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "INPUT_NO_OUTGOING",
			severity: "warning",
			message: 'INPUT node "raw-data" at row 1 has no outgoing connections',
			nodeId: "raw-data",
			nodeType: "INPUT",
			rowIndex: 0,
		});
	});

	it("should detect OUTPUT nodes without incoming edges", () => {
		// Given: OUTPUT node with no incoming edges
		const nodes = [
			{ id: "source", title: "Source Data", type: "INPUT" },
			{ id: "final-metric", title: "Final Metric", type: "OUTPUT" },
		];
		const edges = [{ source: "source", target: "intermediate" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return warning for OUTPUT node isolation
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "OUTPUT_NO_INCOMING",
			severity: "warning",
			message:
				'OUTPUT node "final-metric" at row 2 has no incoming connections',
			nodeId: "final-metric",
			nodeType: "OUTPUT",
			rowIndex: 1,
		});
	});

	it("should detect STEP nodes without both incoming and outgoing edges", () => {
		// Given: STEP node missing either incoming or outgoing connections
		const nodes = [
			{ id: "source", title: "Source", type: "INPUT" },
			{ id: "orphaned-step", title: "Orphaned Step", type: "STEP" },
			{ id: "target", title: "Target", type: "OUTPUT" },
		];
		const edges = [{ source: "source", target: "target" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return critical error for incomplete STEP node
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "STEP_NO_CONNECTIONS",
			severity: "critical",
			message:
				'STEP node "orphaned-step" at row 2 has no incoming or outgoing connections',
			nodeId: "orphaned-step",
			nodeType: "STEP",
			rowIndex: 1,
		});
	});

	it("should detect STEP nodes with only incoming edges", () => {
		// Given: STEP node with incoming but no outgoing edges
		const nodes = [
			{ id: "source", title: "Source", type: "INPUT" },
			{ id: "dead-end-step", title: "Dead End Step", type: "STEP" },
		];
		const edges = [{ source: "source", target: "dead-end-step" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return critical error for STEP node without outgoing edges
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "STEP_NO_OUTGOING",
			severity: "critical",
			message: 'STEP node "dead-end-step" at row 2 has no outgoing connections',
			nodeId: "dead-end-step",
			nodeType: "STEP",
			rowIndex: 1,
		});
	});

	it("should detect STEP nodes with only outgoing edges", () => {
		// Given: STEP node with outgoing but no incoming edges
		const nodes = [
			{ id: "floating-step", title: "Floating Step", type: "STEP" },
			{ id: "target", title: "Target", type: "OUTPUT" },
		];
		const edges = [{ source: "floating-step", target: "target" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return critical error for STEP node without incoming edges
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "STEP_NO_INCOMING",
			severity: "critical",
			message: 'STEP node "floating-step" at row 1 has no incoming connections',
			nodeId: "floating-step",
			nodeType: "STEP",
			rowIndex: 0,
		});
	});

	it("should detect completely orphaned STEP nodes", () => {
		// Given: STEP node with no connections at all
		const nodes = [
			{ id: "connected", title: "Connected Node", type: "INPUT" },
			{ id: "orphaned", title: "Orphaned Node", type: "STEP" },
			{ id: "target", title: "Target Node", type: "OUTPUT" },
		];
		const edges = [{ source: "connected", target: "target" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return critical error for isolated STEP node (type-specific error takes precedence)
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "STEP_NO_CONNECTIONS",
			severity: "critical",
			message:
				'STEP node "orphaned" at row 2 has no incoming or outgoing connections',
			nodeId: "orphaned",
			nodeType: "STEP",
			rowIndex: 1,
		});
	});

	it("should detect completely orphaned INPUT nodes as generic orphans", () => {
		// Given: INPUT node with no connections at all (should get both INPUT_NO_OUTGOING and general connectivity warnings)
		const nodes = [
			{ id: "connected-input", title: "Connected Input", type: "INPUT" },
			{ id: "orphaned-input", title: "Orphaned Input", type: "INPUT" },
			{ id: "target", title: "Target Node", type: "OUTPUT" },
		];
		const edges = [{ source: "connected-input", target: "target" }];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return warning for INPUT node with no outgoing connections
		expect(result.isValid).toBe(false);
		expect(result.errors).toContainEqual({
			type: "INPUT_NO_OUTGOING",
			severity: "warning",
			message:
				'INPUT node "orphaned-input" at row 2 has no outgoing connections',
			nodeId: "orphaned-input",
			nodeType: "INPUT",
			rowIndex: 1,
		});
	});

	it("should return success when all nodes have appropriate connections", () => {
		// Given: valid nodes and edges with all required connections
		const nodes = [
			{ id: "input", title: "Input Data", type: "INPUT" },
			{ id: "step", title: "Processing Step", type: "STEP" },
			{ id: "output", title: "Final Output", type: "OUTPUT" },
		];
		const edges = [
			{ source: "input", target: "step" },
			{ source: "step", target: "output" },
		];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle complex valid graph structures", () => {
		// Given: complex but valid graph with multiple connections
		const nodes = [
			{ id: "input1", title: "Input 1", type: "INPUT" },
			{ id: "input2", title: "Input 2", type: "INPUT" },
			{ id: "step1", title: "Step 1", type: "STEP" },
			{ id: "step2", title: "Step 2", type: "STEP" },
			{ id: "output", title: "Final Output", type: "OUTPUT" },
		];
		const edges = [
			{ source: "input1", target: "step1" },
			{ source: "input2", target: "step1" },
			{ source: "step1", target: "step2" },
			{ source: "step2", target: "output" },
		];

		// When: validateNodeConnectivity called
		const result = validateNodeConnectivity(nodes, edges);

		// Then: should return success
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});
