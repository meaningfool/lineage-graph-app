import type { Edge, Node } from "reactflow";
import { describe, expect, it } from "vitest";
import { assignLayers, type NodeType } from "./graph-layout-utils";

// Helper to create nodes easily
const createNode = (id: string, type: NodeType): Node => ({
	id,
	position: { x: 0, y: 0 },
	data: { type },
});

// Helper to create edges easily
const createEdge = (source: string, target: string): Edge => ({
	id: `${source}-${target}`,
	source,
	target,
});

describe("Graph Layout Utils", () => {
	describe("Basic Flows", () => {
		it("should layout a simple chain: Input -> Step -> Output", () => {
			const nodes = [
				createNode("Input", "INPUT"),
				createNode("Step", "STEP"),
				createNode("Output", "OUTPUT"),
			];
			const edges = [createEdge("Input", "Step"), createEdge("Step", "Output")];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			// Output is sink -> Layer 0
			expect(layerMap.get("Output")).toBe(0);
			// Step -> Layer 1
			expect(layerMap.get("Step")).toBe(1);
			// Input -> Layer 2
			expect(layerMap.get("Input")).toBe(2);
		});

		it("should layout convergent flow: 2 Inputs -> 1 Output", () => {
			const nodes = [
				createNode("In1", "INPUT"),
				createNode("In2", "INPUT"),
				createNode("Out", "OUTPUT"),
			];
			const edges = [createEdge("In1", "Out"), createEdge("In2", "Out")];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			expect(layerMap.get("Out")).toBe(0);
			expect(layerMap.get("In1")).toBe(1);
			expect(layerMap.get("In2")).toBe(1);
		});

		it("should layout divergent flow: 1 Input -> 2 Outputs", () => {
			const nodes = [
				createNode("In", "INPUT"),
				createNode("Out1", "OUTPUT"),
				createNode("Out2", "OUTPUT"),
			];
			const edges = [createEdge("In", "Out1"), createEdge("In", "Out2")];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			expect(layerMap.get("Out1")).toBe(0);
			expect(layerMap.get("Out2")).toBe(0);
			expect(layerMap.get("In")).toBe(1);
		});
	});

	describe("Invalid Graphs & Cycles", () => {
		it("should handle backward edge: Output -> Step", () => {
			// Logic should reverse this to Step -> Output for layering
			const nodes = [
				createNode("Step", "STEP"),
				createNode("Output", "OUTPUT"),
			];
			const edges = [
				createEdge("Output", "Step"), // Invalid direction
			];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			expect(layerMap.get("Output")).toBe(0);
			expect(layerMap.get("Step")).toBe(1); // Should be treated as upstream of Output
		});

		it("should handle self-cycle: Step -> Step", () => {
			const nodes = [
				createNode("In", "INPUT"),
				createNode("Step", "STEP"),
				createNode("Out", "OUTPUT"),
			];
			const edges = [
				createEdge("In", "Step"),
				createEdge("Step", "Step"), // Self-cycle
				createEdge("Step", "Out"),
			];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			expect(layerMap.get("Out")).toBe(0);
			expect(layerMap.get("Step")).toBe(1);
			expect(layerMap.get("In")).toBe(2);
		});

		it("should handle isolated cycle (floating)", () => {
			const nodes = [createNode("A", "STEP"), createNode("B", "STEP")];
			const edges = [createEdge("A", "B"), createEdge("B", "A")];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			// Pseudo-sink logic should pick one (alphabetical) as sink
			// A < B alphabetically. A becomes sink (Layer 1).
			// B -> A means B is Layer 2.
			// Wait, logic says:
			// 1. Sort unvisited: [A, B]
			// 2. Pick A as pseudo-sink -> Layer 1
			// 3. Traverse upstream from A.
			//    Parents of A is B (since B->A).
			//    B gets Layer 2.
			//    Parents of B is A (since A->B). A visited. Stop.

			expect(layerMap.get("A")).toBe(1);
			expect(layerMap.get("B")).toBe(2);
		});
	});

	describe("Input Alignment", () => {
		it("should align all inputs to the max layer", () => {
			// Chain 1: In1 -> Out (Depth 1)
			// Chain 2: In2 -> Step -> Out (Depth 2)
			// In1 should be pushed to Layer 2 to align with In2
			const nodes = [
				createNode("In1", "INPUT"),
				createNode("In2", "INPUT"),
				createNode("Step", "STEP"),
				createNode("Out", "OUTPUT"),
			];
			const edges = [
				createEdge("In1", "Out"),
				createEdge("In2", "Step"),
				createEdge("Step", "Out"),
			];

			const layouted = assignLayers(nodes, edges);
			const layerMap = new Map(layouted.map((n) => [n.id, n.data.layer]));

			expect(layerMap.get("Out")).toBe(0);
			expect(layerMap.get("Step")).toBe(1);
			expect(layerMap.get("In2")).toBe(2);
			expect(layerMap.get("In1")).toBe(2); // Should be aligned
		});
	});
});
