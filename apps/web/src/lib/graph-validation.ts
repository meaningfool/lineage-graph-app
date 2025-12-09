import type { GraphEdge, GraphNode } from "./csv-graph-importer";
import { buildDegreeMap } from "./graph-validation/degree-calculator";
import { detectMultiNodeCycles } from "./graph-validation/multi-cycle-validator";
import { validateNodeConnectivity } from "./graph-validation/node-connectivity-validator";
import { detectSelfCycles } from "./graph-validation/self-cycle-validator";

/**
 * Graph Validation Orchestrator
 *
 * This function acts as the central hub for all graph validation logic.
 * It follows the "Strategy Pattern" where specific validation rules are
 * encapsulated in separate validator functions.
 *
 * Architecture:
 * 1. Pre-calculation: Expensive operations (like degree calculation) are done once.
 * 2. Composition: Independent validators are called sequentially.
 * 3. Aggregation: Errors from all validators are merged into a single result.
 *
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]> and Map<EdgeId, ErrorMessages[]>
 */
export interface ValidationError {
	message: string;
	relatedIds?: string[];
}

/**
 * Graph Validation Orchestrator
 * ...
 * @returns Map<NodeId, ValidationError[]> and Map<EdgeId, ValidationError[]>
 */
export function validateGraph(
	nodes: GraphNode[],
	edges: GraphEdge[],
): {
	nodeErrors: Map<string, ValidationError[]>;
	edgeErrors: Map<string, ValidationError[]>;
} {
	// --- 1. Pre-calculation Phase ---
	const { inDegree, outDegree } = buildDegreeMap(nodes, edges);

	const edgeErrors = new Map<string, ValidationError[]>();
	const nodeErrors = new Map<string, ValidationError[]>();

	// Helper to get node labels for context
	const nodeLabels = new Map(nodes.map((n) => [n.id, n.title || n.id]));
	console.log(
		"[GraphValidation] Node Labels:",
		Array.from(nodeLabels.entries()),
	);

	// --- 2. Validation Phase ---

	// Validator A: Check for edges that connect a node to itself (A -> A)
	const selfCycleErrors = detectSelfCycles(edges, nodeLabels);
	mergeErrors(edgeErrors, selfCycleErrors);

	// Validator B: Check business rules
	const connectivityErrors = validateNodeConnectivity(
		nodes,
		inDegree,
		outDegree,
	);
	mergeErrors(nodeErrors, connectivityErrors);

	// Validator C: Check for complex cycles
	// We explicitly cast to ensure TS knows the structure matches (validators are updated)
	const multiCycleErrors = detectMultiNodeCycles(nodes, edges, nodeLabels);
	mergeErrors(edgeErrors, multiCycleErrors);

	return { nodeErrors, edgeErrors };
}

function mergeErrors(
	target: Map<string, ValidationError[]>,
	source: Map<string, ValidationError[]>,
) {
	source.forEach((errors, key) => {
		const current = target.get(key) || [];
		// Avoid duplicates by message
		const newErrors = errors.filter(
			(err) => !current.some((c) => c.message === err.message),
		);
		if (newErrors.length > 0) {
			target.set(key, [...current, ...newErrors]);
		}
	});
}
