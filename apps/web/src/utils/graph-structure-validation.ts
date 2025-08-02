export interface GraphValidationError {
	type:
		| "INPUT_NO_OUTGOING"
		| "OUTPUT_NO_INCOMING"
		| "STEP_NO_CONNECTIONS"
		| "STEP_NO_INCOMING"
		| "STEP_NO_OUTGOING"
		| "ORPHANED_NODE";
	severity: "critical" | "warning";
	message: string;
	nodeId: string;
	nodeType: string;
	rowIndex: number;
}

export interface GraphValidationResult {
	isValid: boolean;
	errors: GraphValidationError[];
	severity: "critical" | "non-critical";
	blocking: boolean;
}

export interface NodeData {
	id: string;
	title: string;
	type: "INPUT" | "STEP" | "OUTPUT";
}

export interface EdgeData {
	source: string;
	target: string;
}

export function validateNodeConnectivity(
	nodes: NodeData[],
	edges: EdgeData[],
): GraphValidationResult {
	const errors: GraphValidationError[] = [];

	// Build connectivity maps
	const outgoingConnections = new Map<string, string[]>();
	const incomingConnections = new Map<string, string[]>();

	// Initialize all nodes with empty connection arrays
	nodes.forEach((node) => {
		outgoingConnections.set(node.id, []);
		incomingConnections.set(node.id, []);
	});

	// Populate connection maps from edges
	edges.forEach((edge) => {
		// Add outgoing connection for source
		const outgoing = outgoingConnections.get(edge.source) || [];
		outgoing.push(edge.target);
		outgoingConnections.set(edge.source, outgoing);

		// Add incoming connection for target
		const incoming = incomingConnections.get(edge.target) || [];
		incoming.push(edge.source);
		incomingConnections.set(edge.target, incoming);
	});

	// Validate each node based on its type and connectivity requirements
	nodes.forEach((node, index) => {
		const hasIncoming = (incomingConnections.get(node.id) || []).length > 0;
		const hasOutgoing = (outgoingConnections.get(node.id) || []).length > 0;

		switch (node.type) {
			case "INPUT":
				if (!hasOutgoing) {
					errors.push({
						type: "INPUT_NO_OUTGOING",
						severity: "warning",
						message: `INPUT node "${node.id}" at row ${index + 1} has no outgoing connections`,
						nodeId: node.id,
						nodeType: node.type,
						rowIndex: index,
					});
				}
				break;

			case "OUTPUT":
				if (!hasIncoming) {
					errors.push({
						type: "OUTPUT_NO_INCOMING",
						severity: "warning",
						message: `OUTPUT node "${node.id}" at row ${index + 1} has no incoming connections`,
						nodeId: node.id,
						nodeType: node.type,
						rowIndex: index,
					});
				}
				break;

			case "STEP":
				if (!hasIncoming && !hasOutgoing) {
					errors.push({
						type: "STEP_NO_CONNECTIONS",
						severity: "critical",
						message: `STEP node "${node.id}" at row ${index + 1} has no incoming or outgoing connections`,
						nodeId: node.id,
						nodeType: node.type,
						rowIndex: index,
					});
				} else if (!hasIncoming) {
					errors.push({
						type: "STEP_NO_INCOMING",
						severity: "critical",
						message: `STEP node "${node.id}" at row ${index + 1} has no incoming connections`,
						nodeId: node.id,
						nodeType: node.type,
						rowIndex: index,
					});
				} else if (!hasOutgoing) {
					errors.push({
						type: "STEP_NO_OUTGOING",
						severity: "critical",
						message: `STEP node "${node.id}" at row ${index + 1} has no outgoing connections`,
						nodeId: node.id,
						nodeType: node.type,
						rowIndex: index,
					});
				}
				break;
		}

		// Check for completely orphaned nodes (regardless of type)
		if (!hasIncoming && !hasOutgoing) {
			// Only add orphaned error if we haven't already added a type-specific error
			const hasTypeSpecificError = errors.some(
				(error) =>
					error.nodeId === node.id &&
					(error.type === "STEP_NO_CONNECTIONS" ||
						error.type === "INPUT_NO_OUTGOING" ||
						error.type === "OUTPUT_NO_INCOMING"),
			);

			if (!hasTypeSpecificError) {
				errors.push({
					type: "ORPHANED_NODE",
					severity: "critical",
					message: `Node "${node.id}" at row ${index + 1} is completely isolated with no connections`,
					nodeId: node.id,
					nodeType: node.type,
					rowIndex: index,
				});
			}
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		severity: "non-critical", // Graph structure issues are non-critical (individual node problems)
		blocking: errors.length > 0, // But they block import (can't build valid lineage graph)
	};
}
