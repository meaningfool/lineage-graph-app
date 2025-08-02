export interface ValidationError {
	type: string;
	severity: "critical" | "warning" | "info";
	message: string;
	rowIndex?: number;
	field?: string;
	dataType: "nodes" | "edges";
	invalidValue?: string;
	validValues?: string[];
	duplicateId?: string;
	rowIndexes?: number[];
	missingNodeId?: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings?: ValidationError[];
}

// Required fields for different data types
const REQUIRED_FIELDS = {
	nodes: ["id", "title", "type"],
	edges: ["source", "target"],
} as const;

export function validateRequiredFields(
	data: Record<string, any>[],
	dataType: "nodes" | "edges",
): ValidationResult {
	const errors: ValidationError[] = [];
	const requiredFields = REQUIRED_FIELDS[dataType];

	data.forEach((item, index) => {
		requiredFields.forEach((field) => {
			// Check if field is missing or empty (including empty strings)
			if (
				!item[field] ||
				(typeof item[field] === "string" && item[field].trim() === "")
			) {
				errors.push({
					type: "MISSING_REQUIRED_FIELD",
					severity: "critical",
					message: `${dataType === "nodes" ? "Node" : "Edge"} at row ${index + 1} is missing required field: ${field}`,
					rowIndex: index,
					field,
					dataType,
				});
			}
		});
	});

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// Valid node types
const VALID_NODE_TYPES = ["INPUT", "STEP", "OUTPUT"] as const;

export function validateNodeTypes(
	nodes: Record<string, any>[],
): ValidationResult {
	const errors: ValidationError[] = [];

	nodes.forEach((node, index) => {
		if (node.type) {
			// Normalize type to uppercase for comparison
			const normalizedType = String(node.type).toUpperCase();

			// Check if the normalized type is valid
			if (!VALID_NODE_TYPES.includes(normalizedType as any)) {
				errors.push({
					type: "INVALID_NODE_TYPE",
					severity: "critical",
					message: `Node at row ${index + 1} has invalid type: ${node.type}. Must be INPUT, STEP, or OUTPUT`,
					rowIndex: index,
					invalidValue: node.type,
					validValues: [...VALID_NODE_TYPES],
					dataType: "nodes",
				});
			}
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function validateDuplicateNodeIds(
	nodes: Record<string, any>[],
): ValidationResult {
	const errors: ValidationError[] = [];
	const idOccurrences = new Map<string, number[]>();

	// Track all occurrences of each ID
	nodes.forEach((node, index) => {
		if (node.id && typeof node.id === "string" && node.id.trim() !== "") {
			const id = node.id.trim();
			if (!idOccurrences.has(id)) {
				idOccurrences.set(id, []);
			}
			idOccurrences.get(id)!.push(index);
		}
	});

	// Find duplicates and create error messages
	idOccurrences.forEach((rowIndexes, id) => {
		if (rowIndexes.length > 1) {
			const rowNumbers = rowIndexes.map((index) => index + 1).join(", ");
			errors.push({
				type: "DUPLICATE_NODE_ID",
				severity: "critical",
				message: `Duplicate node ID "${id}" found at rows: ${rowNumbers}`,
				duplicateId: id,
				rowIndexes,
				dataType: "nodes",
			});
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function validateEdgeReferences(
	edges: Record<string, any>[],
	nodes: Record<string, any>[],
): ValidationResult {
	const warnings: ValidationError[] = [];

	// Create a set of valid computed node IDs for fast lookup
	const validNodeIds = new Set<string>();
	nodes.forEach((node) => {
		if (node.id && typeof node.id === "string" && node.id.trim() !== "") {
			validNodeIds.add(node.id.trim());
		}
	});

	// Check each edge for missing node references using computed IDs
	edges.forEach((edge, index) => {
		// Check source node reference using computed ID
		if (edge.computedSource && edge.computedSource.trim() !== "") {
			const computedSourceId = edge.computedSource.trim();
			if (!validNodeIds.has(computedSourceId)) {
				warnings.push({
					type: "UNMATCHED_EDGE_SOURCE",
					severity: "warning",
					message: `Edge at row ${index + 1} references unmatched source node: ${edge.source} (computed: ${computedSourceId})`,
					rowIndex: index,
					field: "source",
					missingNodeId: computedSourceId,
					dataType: "edges",
				});
			}
		}

		// Check target node reference using computed ID
		if (edge.computedTarget && edge.computedTarget.trim() !== "") {
			const computedTargetId = edge.computedTarget.trim();
			if (!validNodeIds.has(computedTargetId)) {
				warnings.push({
					type: "UNMATCHED_EDGE_TARGET",
					severity: "warning",
					message: `Edge at row ${index + 1} references unmatched target node: ${edge.target} (computed: ${computedTargetId})`,
					rowIndex: index,
					field: "target",
					missingNodeId: computedTargetId,
					dataType: "edges",
				});
			}
		}
	});

	return {
		isValid: true, // Warnings don't make validation invalid
		errors: [], // No critical errors, only warnings
		warnings,
	};
}
