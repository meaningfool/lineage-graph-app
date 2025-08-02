/**
 * Generates unique IDs for nodes based on their user-provided ID field
 * Uses slugify logic to convert IDs to kebab-case
 * Removes duplicates by keeping first occurrence
 */

interface NodeWithId {
	id?: string;
	[key: string]: any;
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
	let nodeCounter = 0;

	for (const node of nodes) {
		// Handle empty or missing IDs
		const userProvidedId = node.id?.trim();
		let baseId: string;
		let originalId: string;

		if (!userProvidedId) {
			// Use fallback ID for empty IDs
			nodeCounter++;
			baseId = `node-${nodeCounter}`;
			originalId = "";
		} else {
			// Generate ID from user-provided ID using slugify
			baseId = slugify(userProvidedId);
			originalId = userProvidedId;
		}

		// Check for duplicates (case-insensitive)
		if (seenIds.has(baseId)) {
			duplicatesRemoved++;
			continue; // Skip duplicate, don't add to results
		}

		// Mark this ID as seen
		seenIds.add(baseId);

		// Add to processed nodes with all original properties preserved
		processedNodes.push({
			...node,
			id: baseId,
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