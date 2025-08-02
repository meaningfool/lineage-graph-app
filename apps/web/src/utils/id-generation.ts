/**
 * Generates unique IDs for nodes based on their title column
 * Uses slugify logic to convert titles to kebab-case IDs
 */

interface NodeWithTitle {
	title?: string;
	[key: string]: any;
}

interface NodeWithId extends NodeWithTitle {
	id: string;
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
 * Generates unique IDs for nodes based on their title property
 * Handles duplicates by appending numeric suffixes
 * @param nodes - Array of nodes with title property
 * @returns Array of nodes with generated ID property
 */
export function generateNodeIds(nodes: NodeWithTitle[]): NodeWithId[] {
	const idCounts = new Map<string, number>();

	return nodes.map((node, index) => {
		// Handle empty or missing titles
		const title = node.title?.trim();
		let baseId: string;

		if (!title) {
			// Use fallback ID for empty titles
			baseId = `node-${index + 1}`;
		} else {
			// Generate ID from title using slugify
			baseId = slugify(title);
		}

		// Handle duplicates
		const count = idCounts.get(baseId) || 0;
		idCounts.set(baseId, count + 1);

		// Generate final ID with suffix if needed
		const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

		// Return new object with generated ID, preserving all original properties
		return {
			...node,
			id,
		};
	});
}
