import Papa from "papaparse";

// --- DOMAIN TYPES ---
// These types define what our "Graph" looks like in the abstract.
// They are independent of the UI library (React Flow).

// Represents a Node in our graph logic.
export interface GraphNode {
    id: string;
    title: string;
    type: "INPUT" | "STEP" | "OUTPUT";
}

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
}

export interface ValidatedEdgeMapping {
    source: string;
    target: string;
}

// The result of our import process.
// It can contain data (nodes/edges), warnings (things that looked weird but we fixed),
// or a critical error (we couldn't process the file at all).
export interface ImportResult {
    nodes: GraphNode[];
    edges: GraphEdge[];
    warnings: string[];
    error: string | null;
}

// --- HELPER FUNCTIONS ---

// Cleans up ID strings (removes spaces around them).
export const sanitizeId = (id: string) => id.trim();

// Type Guards: These tell TypeScript "Yes, this is definitely a GraphNode".
// Used when filtering arrays to remove null values.
export const isGraphNode = (n: GraphNode | null): n is GraphNode => n !== null;
export const isGraphEdge = (e: GraphEdge | null): e is GraphEdge => e !== null;

// Validates that the user has mapped all required fields.
// Returns null if anything is missing.
export const parseMapping = (
    raw: { id?: string; title?: string; type?: string; source?: string; target?: string }
): { nodes: ValidatedNodeMapping; edges: ValidatedEdgeMapping } | null => {
    const { id, title, type, source, target } = raw;

    if (!id || !title || !type || !source || !target) {
        return null;
    }

    return {
        nodes: { id, title, type },
        edges: { source, target }
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
export const parseFileFull = (file: File): Promise<Papa.ParseResult<any>> => {
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
    nodesData: any[],
    edgesData: any[],
    mapping: { nodes: ValidatedNodeMapping; edges: ValidatedEdgeMapping }
): ImportResult => {
    const { nodes: nodeMapping, edges: edgeMapping } = mapping;
    const validationWarnings: string[] = [];

    // --- NODES PROCESSING ---
    let droppedNodesCount = 0;
    const seenNodeIds = new Map<string, boolean>(); // To track duplicates
    const validTypes = ["INPUT", "STEP", "OUTPUT"];

    const nodes = nodesData
        .map((row: any) => {
            // Get values using the user's mapping
            const rawId = row[nodeMapping.id];
            const titleValue = row[nodeMapping.title];
            const typeValue = row[nodeMapping.type];

            if (!rawId) return null; // Skip empty rows

            const idValue = sanitizeId(rawId);

            // Deduplication: If we've seen this ID before, skip it.
            if (seenNodeIds.has(idValue)) {
                droppedNodesCount++;
                validationWarnings.push(`${idValue}: Duplicate Node ID`);
                return null;
            }
            seenNodeIds.set(idValue, true);

            // Type Validation: Must be INPUT, STEP, or OUTPUT
            const normalizedType = typeValue?.toUpperCase();
            if (!normalizedType || !validTypes.includes(normalizedType)) {
                droppedNodesCount++;
                validationWarnings.push(
                    `${idValue}: Invalid type '${typeValue || ""}'. Valid types: INPUT, STEP, OUTPUT`
                );
                return null;
            }

            return {
                id: idValue,
                title: titleValue,
                type: normalizedType as "INPUT" | "STEP" | "OUTPUT",
            };
        })
        .filter(isGraphNode); // Remove nulls

    if (validationWarnings.length > 0 && droppedNodesCount > 0) {
        validationWarnings.unshift(`${droppedNodesCount} node${droppedNodesCount > 1 ? "s" : ""} dropped`);
    }

    // Create a set of VALID node IDs for edge validation.
    // We need this to check if an edge connects to a real node.
    const validNodeIds = new Set(nodes.map((n) => n.id));

    // --- EDGES PROCESSING ---
    let droppedEdgesCount = 0;
    const seenEdgeKeys = new Map<string, boolean>();

    const edges = edgesData
        .map((row: any) => {
            const rawSource = row[edgeMapping.source];
            const rawTarget = row[edgeMapping.target];

            if (!rawSource || !rawTarget) return null;

            const sourceId = sanitizeId(rawSource);
            const targetId = sanitizeId(rawTarget);

            // Deduplication based on Source-Target pair (Silent drop)
            const edgeKey = `${sourceId}-${targetId}`;
            if (seenEdgeKeys.has(edgeKey)) {
                return null;
            }
            seenEdgeKeys.set(edgeKey, true);

            // Referential Integrity: Do both ends of the edge exist?
            if (!validNodeIds.has(sourceId)) {
                droppedEdgesCount++;
                validationWarnings.push(`Edge dropped: Source '${sourceId}' not found`);
                return null;
            }
            if (!validNodeIds.has(targetId)) {
                droppedEdgesCount++;
                validationWarnings.push(`Edge dropped: Target '${targetId}' not found`);
                return null;
            }

            return {
                source: sourceId,
                target: targetId,
            };
        })
        .filter(isGraphEdge);

    if (droppedEdgesCount > 0) {
        validationWarnings.push(`${droppedEdgesCount} edge${droppedEdgesCount > 1 ? "s" : ""} dropped`);
    }

    // --- WARNING LIMITS ---
    // Don't overwhelm the user with 1000 warnings. Cap it at 10.
    const MAX_WARNINGS = 10;
    const displayWarnings = validationWarnings.slice(0, MAX_WARNINGS);
    if (validationWarnings.length > MAX_WARNINGS) {
        displayWarnings.push(`...and ${validationWarnings.length - MAX_WARNINGS} more warnings`);
    }

    return {
        nodes,
        edges,
        warnings: displayWarnings,
        error: null,
    };
};
