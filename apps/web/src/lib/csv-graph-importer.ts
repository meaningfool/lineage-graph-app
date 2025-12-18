import Papa from "papaparse";
import { GraphEdgeSchema, GraphNodeSchema } from "./csv-schemas";

// --- DOMAIN TYPES ---
// These types define what our "Graph" looks like in the abstract.
// They are independent of the UI library (React Flow).

// Represents a Node in our graph logic.
export interface GraphNode {
	id: string;
	title: string;
	type: "INPUT" | "STEP" | "OUTPUT";
	// biome-ignore lint/suspicious/noExplicitAny: Generic property bag - kept for flexibility
	properties?: Record<string, any>;
}

export type RawCsvRow = Record<string, unknown>;

// Represents an Edge (connection) between two nodes.
export interface GraphEdge {
	source: string;
	target: string;
}

// These types ensure that when we say we have a "Mapping",
// we definitely have strings for all the required fields.
export interface ValidatedNodeMapping {
	id: string;
	title: string;
	type: string;
	properties?: string[];
}

export interface ValidatedEdgeMapping {
	source: string;
	target: string;
}

// [NEW] Structured Warning Report
export interface ImportError {
	id: string;
	message: string;
}

export interface CategoryReport {
	droppedCount: number;
	errors: ImportError[];
}

export interface ImportReport {
	nodes: CategoryReport;
	edges: CategoryReport;
	general: string[];
}

// The result of our import process.
export interface ImportResult {
	nodes: GraphNode[];
	edges: GraphEdge[];
	report: ImportReport; // Replaces 'warnings: string[]'
	error: string | null;
}

// --- HELPER FUNCTIONS ---

// Cleans up ID strings (removes spaces around them).
export const sanitizeId = (id: string) => id.trim();

// Type Guards: These tell TypeScript "Yes, this is definitely a GraphNode".
// Used when filtering arrays to remove null values.
export const isGraphNode = (n: GraphNode | null): n is GraphNode => n !== null;
export const isGraphEdge = (e: GraphEdge | null): e is GraphEdge => e !== null;

// [NEW] Narrow interface for fragile Zod Enum/Literal issue properties
// Helps avoid 'any' casts when probing for allowed values in different Zod versions
interface ZodEnumIssueNarrow {
	values?: string[];
}

/**
 * Resiliently extracts allowed values from a Zod issue.
 * Specifically handles Zod 4.x pattern where enum/literal failures
 * use the 'values' property.
 */
function getAllowedValues(issue: unknown): string[] | undefined {
	const narrow = issue as ZodEnumIssueNarrow;
	const list = narrow.values;
	return Array.isArray(list) ? list : undefined;
}

// Validates that the user has mapped all required fields.
// Returns null if anything is missing.
export const parseMapping = (raw: {
	id?: string;
	title?: string;
	type?: string;
	source?: string;
	target?: string;
	properties?: string[];
}): { nodes: ValidatedNodeMapping; edges: ValidatedEdgeMapping } | null => {
	const { id, title, type, source, target, properties } = raw;

	if (!id || !title || !type || !source || !target) {
		return null;
	}

	return {
		nodes: { id, title, type, properties },
		edges: { source, target },
	};
};

// Reads just the first row of a CSV file to get the headers.
// Uses the 'papaparse' library.
export const parseFileHeaders = (file: File): Promise<string[]> => {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: true,
			preview: 1, // Only read first row for headers
			complete: (results) => {
				const fields = results.meta.fields || [];
				if (fields.length === 0) {
					reject(new Error("No headers found"));
				} else {
					resolve(fields);
				}
			},
			error: (err) => reject(err),
		});
	});
};

// Reads the entire CSV file.
export const parseFileFull = (
	file: File,
): Promise<Papa.ParseResult<unknown>> => {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: true,
			complete: (results) => resolve(results),
			error: (err) => reject(err),
		});
	});
};

// --- CORE LOGIC ---
// This is the "Brain" of the importer.
// It takes raw CSV data and turns it into a clean Graph.
export const buildGraphFromCsv = (
	nodesData: unknown[],
	edgesData: unknown[],
	mapping: { nodes: ValidatedNodeMapping; edges: ValidatedEdgeMapping },
): ImportResult => {
	const { nodes: nodeMapping, edges: edgeMapping } = mapping;

	const report: ImportReport = {
		nodes: { droppedCount: 0, errors: [] },
		edges: { droppedCount: 0, errors: [] },
		general: [],
	};

	const MAX_ERRORS_PER_CATEGORY = 50; // Cap detailed errors to avoid huge objects

	// --- NODES PROCESSING ---
	const seenNodeIds = new Map<string, boolean>(); // To track duplicates

	const nodes = nodesData
		.map((row) => {
			const data = row as RawCsvRow;
			// Get values using the user's mapping
			const rawId = data[nodeMapping.id] as string | undefined;
			const titleValue = data[nodeMapping.title] as string | undefined;
			const typeValue = data[nodeMapping.type] as string | undefined;

			if (!rawId) return null; // Skip empty rows silently

			// Prepare object for Zod validation
			const rawNode = {
				id: rawId,
				title: titleValue,
				type: typeValue?.toUpperCase(), // Normalize type case before validation
				properties: {}, // Will be populated below if valid
			};

			// Validate with Zod (Deep Safety)
			const validation = GraphNodeSchema.safeParse(rawNode);

			if (!validation.success) {
				report.nodes.droppedCount++;
				if (report.nodes.errors.length < MAX_ERRORS_PER_CATEGORY) {
					const issue = validation.error.issues[0];
					let errorMsg = issue.message;

					// Clarify validation errors with allowed values (Zod 4.x pattern)
					const code = issue.code as string;
					if (code === "invalid_value") {
						const options = getAllowedValues(issue);
						if (options) {
							errorMsg = `Invalid value. Must be one of: ${options.join(", ")}`;
						}
					}

					// Prefix field name if available
					if (issue.path.length > 0) {
						errorMsg = `${issue.path.join(".")}: ${errorMsg}`;
					}

					const identifier = rawId
						? `ID: ${rawId}`
						: `Row ${nodesData.indexOf(row) + 1}`;
					report.nodes.errors.push({ id: identifier, message: errorMsg });
				}
				return null;
			}

			const validNode = validation.data;

			// Deduplication: If we've seen this ID before, skip it.
			if (seenNodeIds.has(validNode.id)) {
				report.nodes.droppedCount++;
				if (report.nodes.errors.length < MAX_ERRORS_PER_CATEGORY) {
					report.nodes.errors.push({
						id: `ID: ${validNode.id}`,
						message: "Duplicate Node ID",
					});
				}
				return null;
			}
			seenNodeIds.set(validNode.id, true);

			// Extract Properties (Explicit Import)
			// Only import properties that are explicitly selected in the mapping
			const properties: Record<string, unknown> = {};
			const selectedProperties = nodeMapping.properties || [];

			selectedProperties.forEach((key) => {
				const val = data[key];
				if (val !== undefined && val !== "") {
					properties[key] = val;
				}
			});

			return {
				id: validNode.id,
				title: validNode.title,
				// Cast is safe because Zod validated it as "INPUT" | "STEP" | "OUTPUT"
				type: validNode.type as "INPUT" | "STEP" | "OUTPUT",
				properties: Object.keys(properties).length > 0 ? properties : undefined,
			} as GraphNode;
		})
		.filter((n): n is GraphNode => n !== null); // Explicit type guard inline to be safe

	// Create a set of VALID node IDs for edge validation.
	// We need this to check if an edge connects to a real node.
	const validNodeIds = new Set(nodes.map((n) => n.id));

	// --- EDGES PROCESSING ---
	const seenEdgeKeys = new Map<string, boolean>();

	const edges = edgesData
		.map((row) => {
			const data = row as RawCsvRow;
			const rawSource = data[edgeMapping.source] as string | undefined;
			const rawTarget = data[edgeMapping.target] as string | undefined;

			// Skip empty rows silently (matches Node behavior)
			if (!rawSource || !rawTarget) return null;

			// Prepare object for Zod validation
			const rawEdge = {
				source: rawSource,
				target: rawTarget,
			};

			// Validate with Zod (Deep Safety)
			const validation = GraphEdgeSchema.safeParse(rawEdge);

			if (!validation.success) {
				report.edges.droppedCount++;
				if (report.edges.errors.length < MAX_ERRORS_PER_CATEGORY) {
					report.edges.errors.push({
						id: "Unknown",
						message: "Invalid format",
					});
				}
				return null;
			}

			const validEdge = validation.data;

			const sourceId = sanitizeId(validEdge.source);
			const targetId = sanitizeId(validEdge.target);

			// Deduplication based on Source-Target pair (Silent drop)
			const edgeKey = `${sourceId}-${targetId}`;
			if (seenEdgeKeys.has(edgeKey)) {
				return null;
			}
			seenEdgeKeys.set(edgeKey, true);

			// Referential Integrity: Do both ends of the edge exist?
			if (!validNodeIds.has(sourceId)) {
				report.edges.droppedCount++;
				if (report.edges.errors.length < MAX_ERRORS_PER_CATEGORY) {
					report.edges.errors.push({
						id: `Edge to ID: ${targetId}`,
						message: `Source ID: '${sourceId}' not found`,
					});
				}
				return null;
			}
			if (!validNodeIds.has(targetId)) {
				report.edges.droppedCount++;
				if (report.edges.errors.length < MAX_ERRORS_PER_CATEGORY) {
					report.edges.errors.push({
						id: `Edge from ID: ${sourceId}`,
						message: `Target ID: '${targetId}' not found`,
					});
				}
				return null;
			}

			return {
				source: sourceId,
				target: targetId,
			};
		})
		.filter(isGraphEdge);

	return {
		nodes,
		edges,
		report,
		error: null,
	};
};
