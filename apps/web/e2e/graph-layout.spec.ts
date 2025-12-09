import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

const getFixture = (file: string) =>
	path.join(__dirname, "fixtures", "graph-layout", file);

test.describe("Graph Layout", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ page }) => {
		// Capture browser console logs
		page.on("console", (msg) => {
			if (msg.type() === "error" || msg.text().includes("DEBUG")) {
				console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
			}
		});

		const lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	test.describe("Slice 1: Basic Flows (Valid Graphs)", () => {
		test("Chain Flow: Input → Step1 → Step2 → Output", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_chain_nodes.csv"),
				getFixture("graph_layout_chain_edges.csv"),
			);

			// Verify all 4 nodes are visible
			await lineagePage.verifyGraphNode("Input Node");
			await lineagePage.verifyGraphNode("Step 1");
			await lineagePage.verifyGraphNode("Step 2");
			await lineagePage.verifyGraphNode("Output Node");

			// Get positions
			const output = await lineagePage.getGraphNodePosition("Output Node");
			const step2 = await lineagePage.getGraphNodePosition("Step 2");
			const step1 = await lineagePage.getGraphNodePosition("Step 1");
			const input = await lineagePage.getGraphNodePosition("Input Node");

			// Verify horizontal ordering (left to right): Output < Step2 < Step1 < Input
			expect(output.x).toBeLessThan(step2.x);
			expect(step2.x).toBeLessThan(step1.x);
			expect(step1.x).toBeLessThan(input.x);

			// Verify layer assignments via data-layer attribute
			const outputLayer = await lineagePage.getGraphNodeLayer("Output Node");
			const step2Layer = await lineagePage.getGraphNodeLayer("Step 2");
			const step1Layer = await lineagePage.getGraphNodeLayer("Step 1");
			const inputLayer = await lineagePage.getGraphNodeLayer("Input Node");

			expect(outputLayer).toBe("0"); // Output at Layer 0 (leftmost)
			expect(step2Layer).toBe("1"); // Step2 at Layer 1
			expect(step1Layer).toBe("2"); // Step1 at Layer 2
			expect(inputLayer).toBe("3"); // Input at Layer 3 (rightmost)
		});

		test("Convergent Flow: Two paths converging to one output", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_convergent_nodes.csv"),
				getFixture("graph_layout_convergent_edges.csv"),
			);

			// Verify all 5 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("Input 2");
			await lineagePage.verifyGraphNode("Step A");
			await lineagePage.verifyGraphNode("Step B");
			await lineagePage.verifyGraphNode("Output 1");

			// Get positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const stepB = await lineagePage.getGraphNodePosition("Step B");
			const stepA = await lineagePage.getGraphNodePosition("Step A");
			const input1 = await lineagePage.getGraphNodePosition("Input 1");
			const input2 = await lineagePage.getGraphNodePosition("Input 2");

			// Verify horizontal ordering
			// Output1 < StepB < StepA < Input1
			expect(output1.x).toBeLessThan(stepB.x);
			expect(stepB.x).toBeLessThan(stepA.x);
			expect(stepA.x).toBeLessThan(input1.x);

			// Output1 < StepB < Input2
			expect(output1.x).toBeLessThan(stepB.x);
			expect(stepB.x).toBeLessThan(input2.x);

			// Verify layer assignments via data-layer attribute
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const stepBLayer = await lineagePage.getGraphNodeLayer("Step B");
			const stepALayer = await lineagePage.getGraphNodeLayer("Step A");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const input2Layer = await lineagePage.getGraphNodeLayer("Input 2");

			expect(output1Layer).toBe("0"); // Output1 at Layer 0
			expect(stepBLayer).toBe("1"); // StepB at Layer 1 (distance 1 from Output1)
			expect(stepALayer).toBe("2"); // StepA at Layer 2 (distance 2 from Output1)
			expect(input1Layer).toBe("3"); // Input1 at Layer 3
			expect(input2Layer).toBe("3"); // Input2 at Layer 3
		});

		test("Divergent Flow: One input diverging to two outputs", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_divergent_nodes.csv"),
				getFixture("graph_layout_divergent_edges.csv"),
			);

			// Verify all 5 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("Step A");
			await lineagePage.verifyGraphNode("Step B");
			await lineagePage.verifyGraphNode("Output 1");
			await lineagePage.verifyGraphNode("Output 2");

			// Get positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const output2 = await lineagePage.getGraphNodePosition("Output 2");
			const stepB = await lineagePage.getGraphNodePosition("Step B");
			const stepA = await lineagePage.getGraphNodePosition("Step A");
			const input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Verify horizontal ordering
			// Output1 < StepB < StepA < Input1
			expect(output1.x).toBeLessThan(stepB.x);
			expect(stepB.x).toBeLessThan(stepA.x);
			expect(stepA.x).toBeLessThan(input1.x);

			// Output2 < StepA < Input1
			expect(output2.x).toBeLessThan(stepA.x);
			expect(stepA.x).toBeLessThan(input1.x);

			// Verify layer assignments via data-layer attribute
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const output2Layer = await lineagePage.getGraphNodeLayer("Output 2");
			const stepBLayer = await lineagePage.getGraphNodeLayer("Step B");
			const stepALayer = await lineagePage.getGraphNodeLayer("Step A");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");

			expect(output1Layer).toBe("0"); // Output1 at Layer 0
			expect(output2Layer).toBe("0"); // Output2 at Layer 0 (both outputs at leftmost)
			expect(stepBLayer).toBe("1"); // StepB at Layer 1
			expect(stepALayer).toBe("2"); // StepA at Layer 2
			expect(input1Layer).toBe("3"); // Input1 at Layer 3
		});
	});

	test.describe.skip("Slice 2: Invalid Graphs", () => {
		test("1. Invalid Source Direction: Output → Step (backward edge)", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_invalid_source_nodes.csv"),
				getFixture("graph_layout_invalid_source_edges.csv"),
			);

			// Verify all 6 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("S1");
			await lineagePage.verifyGraphNode("S2");
			await lineagePage.verifyGraphNode("S3");
			await lineagePage.verifyGraphNode("S4");
			await lineagePage.verifyGraphNode("Output 1");

			// Get positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const s4 = await lineagePage.getGraphNodePosition("S4");
			const s3 = await lineagePage.getGraphNodePosition("S3");
			const s2 = await lineagePage.getGraphNodePosition("S2");
			const s1 = await lineagePage.getGraphNodePosition("S1");
			const input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Verify horizontal ordering: Output1 < S4 < S3 < S2 < S1 < Input1
			expect(output1.x).toBeLessThan(s4.x);
			expect(s4.x).toBeLessThan(s3.x);
			expect(s3.x).toBeLessThan(s2.x);
			expect(s2.x).toBeLessThan(s1.x);
			expect(s1.x).toBeLessThan(input1.x);

			// Verify layer assignments
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const s4Layer = await lineagePage.getGraphNodeLayer("S4");
			const s3Layer = await lineagePage.getGraphNodeLayer("S3");
			const s2Layer = await lineagePage.getGraphNodeLayer("S2");
			const s1Layer = await lineagePage.getGraphNodeLayer("S1");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");

			expect(output1Layer).toBe("0"); // Output at Layer 0
			expect(s4Layer).toBe("1"); // S4 anchored to Output
			expect(s3Layer).toBe("2");
			expect(s2Layer).toBe("3");
			expect(s1Layer).toBe("4");
			expect(input1Layer).toBe("5"); // Input at Layer 5
		});

		test("2. Missing Output: Input chain with no output", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_missing_output_nodes.csv"),
				getFixture("graph_layout_missing_output_edges.csv"),
			);

			// Verify all 3 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("Step A");
			await lineagePage.verifyGraphNode("Step B");

			// Get positions
			const stepB = await lineagePage.getGraphNodePosition("Step B");
			const stepA = await lineagePage.getGraphNodePosition("Step A");
			const input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Verify horizontal ordering: StepB < StepA < Input1
			expect(stepB.x).toBeLessThan(stepA.x);
			expect(stepA.x).toBeLessThan(input1.x);

			// Verify layer assignments (anchored to Input at right)
			const stepBLayer = await lineagePage.getGraphNodeLayer("Step B");
			const stepALayer = await lineagePage.getGraphNodeLayer("Step A");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");

			expect(stepBLayer).toBe("1"); // StepB at Layer 1 (dead-end sink)
			expect(stepALayer).toBe("2"); // StepA at Layer 2
			expect(input1Layer).toBe("3"); // Input at Layer 3 (max)
		});

		test("3. Missing Input: Step chain ending at output", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_missing_input_nodes.csv"),
				getFixture("graph_layout_missing_input_edges.csv"),
			);

			// Verify all 3 nodes are visible
			await lineagePage.verifyGraphNode("Step A");
			await lineagePage.verifyGraphNode("Step B");
			await lineagePage.verifyGraphNode("Output 1");

			// Get positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const stepB = await lineagePage.getGraphNodePosition("Step B");
			const stepA = await lineagePage.getGraphNodePosition("Step A");

			// Verify horizontal ordering: Output1 < StepB < StepA
			expect(output1.x).toBeLessThan(stepB.x);
			expect(stepB.x).toBeLessThan(stepA.x);

			// Verify layer assignments (anchored to Output at left)
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const stepBLayer = await lineagePage.getGraphNodeLayer("Step B");
			const stepALayer = await lineagePage.getGraphNodeLayer("Step A");

			expect(output1Layer).toBe("0"); // Output at Layer 0
			expect(stepBLayer).toBe("1"); // StepB at Layer 1
			expect(stepALayer).toBe("2"); // StepA at Layer 2
		});

		test("4. Isolated Chain: Steps only (no input, no output)", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_isolated_chain_nodes.csv"),
				getFixture("graph_layout_isolated_chain_edges.csv"),
			);

			// Verify all 3 nodes are visible
			await lineagePage.verifyGraphNode("Step A");
			await lineagePage.verifyGraphNode("Step B");
			await lineagePage.verifyGraphNode("Step C");

			// Get positions
			const stepC = await lineagePage.getGraphNodePosition("Step C");
			const stepB = await lineagePage.getGraphNodePosition("Step B");
			const stepA = await lineagePage.getGraphNodePosition("Step A");

			// Verify horizontal ordering: StepC < StepB < StepA (right to left flow)
			expect(stepC.x).toBeLessThan(stepB.x);
			expect(stepB.x).toBeLessThan(stepA.x);

			// Verify layer assignments (StepC is sink at Layer 1, not 0)
			const stepCLayer = await lineagePage.getGraphNodeLayer("Step C");
			const stepBLayer = await lineagePage.getGraphNodeLayer("Step B");
			const stepALayer = await lineagePage.getGraphNodeLayer("Step A");

			expect(stepCLayer).toBe("1"); // StepC (sink) at Layer 1
			expect(stepBLayer).toBe("2"); // StepB at Layer 2
			expect(stepALayer).toBe("3"); // StepA (source) at Layer 3
		});

		test("5. Mixed: Valid chain + Missing Output chain", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_mixed_missing_output_nodes.csv"),
				getFixture("graph_layout_mixed_missing_output_edges.csv"),
			);

			// Verify all 9 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("S1");
			await lineagePage.verifyGraphNode("S2");
			await lineagePage.verifyGraphNode("S3");
			await lineagePage.verifyGraphNode("S4");
			await lineagePage.verifyGraphNode("Output 1");
			await lineagePage.verifyGraphNode("Input 2");
			await lineagePage.verifyGraphNode("T1");
			await lineagePage.verifyGraphNode("T2");

			// Valid chain positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const s4 = await lineagePage.getGraphNodePosition("S4");
			const s1 = await lineagePage.getGraphNodePosition("S1");
			const input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Invalid chain positions
			const input2 = await lineagePage.getGraphNodePosition("Input 2");
			const t1 = await lineagePage.getGraphNodePosition("T1");
			const t2 = await lineagePage.getGraphNodePosition("T2");

			// Valid chain ordering
			expect(output1.x).toBeLessThan(s4.x);
			expect(s4.x).toBeLessThan(s1.x);
			expect(s1.x).toBeLessThan(input1.x);

			// Invalid chain ordering: T2 < T1 < Input2
			expect(t2.x).toBeLessThan(t1.x);
			expect(t1.x).toBeLessThan(input2.x);

			// Verify layer assignments
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const input2Layer = await lineagePage.getGraphNodeLayer("Input 2");
			const t1Layer = await lineagePage.getGraphNodeLayer("T1");
			const t2Layer = await lineagePage.getGraphNodeLayer("T2");

			expect(output1Layer).toBe("0"); // Output1 at Layer 0
			expect(input1Layer).toBe("5"); // Input1 at Layer 5 (global max)
			expect(input2Layer).toBe("5"); // Input2 also at Layer 5 (right-aligned)
			expect(t1Layer).toBe("2"); // T1 at Layer 2
			expect(t2Layer).toBe("1"); // T2 at Layer 1 (dead-end sink)
		});

		test("6. Mixed: Valid chain + Missing Input chain", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_mixed_missing_input_nodes.csv"),
				getFixture("graph_layout_mixed_missing_input_edges.csv"),
			);

			// Verify all 9 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("S1");
			await lineagePage.verifyGraphNode("S2");
			await lineagePage.verifyGraphNode("S3");
			await lineagePage.verifyGraphNode("S4");
			await lineagePage.verifyGraphNode("Output 1");
			await lineagePage.verifyGraphNode("T1");
			await lineagePage.verifyGraphNode("T2");
			await lineagePage.verifyGraphNode("Output 2");

			// Valid chain positions
			const _output1 = await lineagePage.getGraphNodePosition("Output 1");
			const _input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Invalid chain positions
			const output2 = await lineagePage.getGraphNodePosition("Output 2");
			const t2 = await lineagePage.getGraphNodePosition("T2");
			const t1 = await lineagePage.getGraphNodePosition("T1");

			// Invalid chain ordering: Output2 < T2 < T1
			expect(output2.x).toBeLessThan(t2.x);
			expect(t2.x).toBeLessThan(t1.x);

			// Verify layer assignments
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const output2Layer = await lineagePage.getGraphNodeLayer("Output 2");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const t1Layer = await lineagePage.getGraphNodeLayer("T1");
			const t2Layer = await lineagePage.getGraphNodeLayer("T2");

			expect(output1Layer).toBe("0"); // Output1 at Layer 0
			expect(output2Layer).toBe("0"); // Output2 at Layer 0 (left-aligned)
			expect(input1Layer).toBe("5"); // Input1 at Layer 5
			expect(t2Layer).toBe("1"); // T2 at Layer 1
			expect(t1Layer).toBe("2"); // T1 at Layer 2 (starts in middle)
		});

		test("7. Mixed: Valid chain + Isolated chain", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_mixed_isolated_nodes.csv"),
				getFixture("graph_layout_mixed_isolated_edges.csv"),
			);

			// Verify all 9 nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("S1");
			await lineagePage.verifyGraphNode("S2");
			await lineagePage.verifyGraphNode("S3");
			await lineagePage.verifyGraphNode("S4");
			await lineagePage.verifyGraphNode("Output 1");
			await lineagePage.verifyGraphNode("T1");
			await lineagePage.verifyGraphNode("T2");
			await lineagePage.verifyGraphNode("T3");

			// Valid chain positions
			const _output1 = await lineagePage.getGraphNodePosition("Output 1");
			const _input1 = await lineagePage.getGraphNodePosition("Input 1");

			// Isolated chain positions
			const t3 = await lineagePage.getGraphNodePosition("T3");
			const t2 = await lineagePage.getGraphNodePosition("T2");
			const t1 = await lineagePage.getGraphNodePosition("T1");

			// Isolated chain ordering: T3 < T2 < T1
			expect(t3.x).toBeLessThan(t2.x);
			expect(t2.x).toBeLessThan(t1.x);

			// Verify layer assignments
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const t3Layer = await lineagePage.getGraphNodeLayer("T3");
			const t2Layer = await lineagePage.getGraphNodeLayer("T2");
			const t1Layer = await lineagePage.getGraphNodeLayer("T1");

			expect(output1Layer).toBe("0"); // Output1 at Layer 0
			expect(input1Layer).toBe("5"); // Input1 at Layer 5
			// Isolated chain: Steps cannot be at Layer 0 (Output) or Layer 5 (Input)
			expect(t3Layer).toBe("1"); // T3 (sink) at Layer 1 (closest to output)
			expect(t2Layer).toBe("2"); // T2 at Layer 2
			expect(t1Layer).toBe("3"); // T1 (source) at Layer 3
		});

		test("8. Input-Input Connection", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_input_input_nodes.csv"),
				getFixture("graph_layout_input_input_edges.csv"),
			);

			// Verify both nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("Input 2");

			// Get positions
			const input1 = await lineagePage.getGraphNodePosition("Input 1");
			const input2 = await lineagePage.getGraphNodePosition("Input 2");

			// Both inputs should be at the same x position (same layer)
			expect(input1.x).toBe(input2.x);

			// Verify layer assignments - both at Input layer (max)
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const input2Layer = await lineagePage.getGraphNodeLayer("Input 2");

			expect(input1Layer).toBe(input2Layer); // Same layer
			expect(input1Layer).toBe("0"); // At Layer 0 (Early Exit for Input-Only/Ignored Edges)
		});

		test("9. Output-Output Connection", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_output_output_nodes.csv"),
				getFixture("graph_layout_output_output_edges.csv"),
			);

			// Verify both nodes are visible
			await lineagePage.verifyGraphNode("Output 1");
			await lineagePage.verifyGraphNode("Output 2");

			// Get positions
			const output1 = await lineagePage.getGraphNodePosition("Output 1");
			const output2 = await lineagePage.getGraphNodePosition("Output 2");

			// Both outputs should be at the same x position (same layer)
			expect(output1.x).toBe(output2.x);

			// Verify layer assignments - both at Output layer (0)
			const output1Layer = await lineagePage.getGraphNodeLayer("Output 1");
			const output2Layer = await lineagePage.getGraphNodeLayer("Output 2");

			expect(output1Layer).toBe("0"); // Output at Layer 0
			expect(output2Layer).toBe("0"); // Output at Layer 0
		});

		test("10. Input-Only Graph", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				getFixture("graph_layout_input_only_nodes.csv"),
				getFixture("graph_layout_input_only_edges.csv"),
			);

			// Verify both nodes are visible
			await lineagePage.verifyGraphNode("Input 1");
			await lineagePage.verifyGraphNode("Input 2");

			// Get positions
			const input1 = await lineagePage.getGraphNodePosition("Input 1");
			const input2 = await lineagePage.getGraphNodePosition("Input 2");

			// Both inputs should be at the same x position (Layer 0 for input-only)
			expect(input1.x).toBe(input2.x);

			// Verify layer assignments - Early Exit: All at Layer 0
			const input1Layer = await lineagePage.getGraphNodeLayer("Input 1");
			const input2Layer = await lineagePage.getGraphNodeLayer("Input 2");

			expect(input1Layer).toBe("0"); // Layer 0 (early exit for input-only)
			expect(input2Layer).toBe("0"); // Layer 0 (early exit for input-only)
		});
	});

	test.describe.skip("Slice 3: Cycles (Self-Loops & Feedback)", () => {
		test("1. Self-Cycle: Step with self-loop in valid chain", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				path.join(
					__dirname,
					"fixtures",
					"graph-validation",
					"nodes_self_cycle.csv",
				),
				path.join(
					__dirname,
					"fixtures",
					"graph-validation",
					"edges_self_cycle.csv",
				),
			);

			// Verify nodes are visible
			await lineagePage.verifyGraphNode("Valid Input");
			await lineagePage.verifyGraphNode("Self Cycle Step");
			await lineagePage.verifyGraphNode("Valid Output");

			// Get positions
			const output = await lineagePage.getGraphNodePosition("Valid Output");
			const step = await lineagePage.getGraphNodePosition("Self Cycle Step");
			const input = await lineagePage.getGraphNodePosition("Valid Input");

			// Verify horizontal ordering: Output < Step < Input
			expect(output.x).toBeLessThan(step.x);
			expect(step.x).toBeLessThan(input.x);

			// Verify layer assignments
			const outputLayer = await lineagePage.getGraphNodeLayer("Valid Output");
			const stepLayer = await lineagePage.getGraphNodeLayer("Self Cycle Step");
			const inputLayer = await lineagePage.getGraphNodeLayer("Valid Input");

			expect(outputLayer).toBe("0");
			expect(stepLayer).toBe("1");
			expect(inputLayer).toBe("2");
		});

		test("2. Isolated Cycle: 3-node cycle (Floating)", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.importGraph(
				path.join(__dirname, "fixtures", "graph-validation", "nodes_cycle.csv"),
				path.join(__dirname, "fixtures", "graph-validation", "edges_cycle.csv"),
			);

			// Verify nodes are visible
			await lineagePage.verifyGraphNode("Node A");
			await lineagePage.verifyGraphNode("Node B");
			await lineagePage.verifyGraphNode("Node C");

			// Get positions
			const nodeA = await lineagePage.getGraphNodePosition("Node A");
			const nodeB = await lineagePage.getGraphNodePosition("Node B");
			const nodeC = await lineagePage.getGraphNodePosition("Node C");

			// Verify nodes are NOT all at the same layer (unrolled)
			// With Pseudo-Sink strategy:
			// Node A (lowest ID) -> Layer 1
			// Node C -> Layer 2
			// Node B -> Layer 3
			// So x coordinates should be different
			expect(nodeA.x).not.toBe(nodeB.x);
			expect(nodeB.x).not.toBe(nodeC.x);

			// Verify layer assignments
			const nodeALayer = await lineagePage.getGraphNodeLayer("Node A");
			const nodeCLayer = await lineagePage.getGraphNodeLayer("Node C");
			const nodeBLayer = await lineagePage.getGraphNodeLayer("Node B");

			expect(nodeALayer).toBe("1"); // Pseudo-Sink
			expect(nodeCLayer).toBe("2");
			expect(nodeBLayer).toBe("3");
		});
	});
});
