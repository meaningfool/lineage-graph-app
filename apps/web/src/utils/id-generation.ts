/**
 * Generates unique IDs for nodes based on their user-provided ID field
 * Uses slugify logic to convert IDs to kebab-case
 * Removes duplicates by keeping first occurrence
 */

interface NodeWithId {
	id?: string;
	[key: string]: any;
}

interface EdgeWithIds {
	source?: string;
	target?: string;
	[key: string]: any;
}

interface ProcessedEdge extends EdgeWithIds {
	source: string;
	target: string;
	computedSource: string;
	computedTarget: string;
}

interface ProcessedNode extends NodeWithId {
	id: string;
	originalId: string;
}

export interface GenerateNodeIdsResult {
	nodes: ProcessedNode[];
	duplicatesRemoved: number;
	message: string;
}

/**
 * Converts a string to a slug format (kebab-case)
 * @param text - The text to slugify
 * @returns The slugified text
 */
function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "") // Remove special characters
		.replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
		.replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

/**
 * Generates unique IDs for nodes based on their user-provided ID property
 * Handles duplicates by keeping first occurrence and dropping subsequent ones
 * @param nodes - Array of nodes with user-provided ID property
 * @returns Object containing processed nodes array, duplicate count, and message
 */
export function generateNodeIds(nodes: NodeWithId[]): GenerateNodeIdsResult {
	const seenIds = new Set<string>();
	const processedNodes: ProcessedNode[] = [];
	let duplicatesRemoved = 0;

	for (const node of nodes) {
		// Only process nodes with valid IDs (empty IDs should be caught by validation)
		const userProvidedId = node.id?.trim();
		
		if (!userProvidedId) {
			// Skip nodes with empty IDs - these should be caught by validation
			continue;
		}

		// Generate ID from user-provided ID using slugify
		const computedId = slugify(userProvidedId);
		const originalId = userProvidedId;

		// Check for duplicates (case-insensitive via slugified ID)
		if (seenIds.has(computedId)) {
			duplicatesRemoved++;
			continue; // Skip duplicate, don't add to results
		}

		// Mark this ID as seen
		seenIds.add(computedId);

		// Add to processed nodes with all original properties preserved
		processedNodes.push({
			...node,
			id: computedId,
			originalId: originalId,
		});
	}

	// Generate appropriate message
	let message = "";
	if (duplicatesRemoved === 1) {
		message = "Removed 1 duplicate node";
	} else if (duplicatesRemoved > 1) {
		message = `Removed ${duplicatesRemoved} duplicate nodes`;
	}

	return {
		nodes: processedNodes,
		duplicatesRemoved,
		message,
	};
}

/**
 * Generates computed IDs for edges based on their source and target fields
 * Applies same slugify logic to edge source and target for consistent matching with nodes
 * @param edges - Array of edges with source and target properties
 * @returns Array of edges with additional computedSource and computedTarget fields
 */
export function generateEdgeIds(edges: EdgeWithIds[]): ProcessedEdge[] {
	return edges.map((edge) => {
		// Handle source ID
		const sourceId = edge.source?.trim();
		const computedSource = sourceId ? slugify(sourceId) : "";

		// Handle target ID  
		const targetId = edge.target?.trim();
		const computedTarget = targetId ? slugify(targetId) : "";

		// Return edge with all original properties plus computed IDs
		return {
			...edge,
			source: edge.source || "",
			target: edge.target || "",
			computedSource,
			computedTarget,
		};
	});
}