import { z } from "zod";

export const GraphNodeSchema = z.object({
	id: z.string().trim().min(1, "ID is required"),
	title: z.string().trim().min(1, "Title is required"),
	type: z.enum(["INPUT", "STEP", "OUTPUT"]),
	// Properties are optional and dynamic, we validate them as key-value pairs if needed, or leave as Record
	properties: z.record(z.string(), z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
	source: z.string().trim().min(1, "Source ID is required"),
	target: z.string().trim().min(1, "Target ID is required"),
});

export type ValidatedGraphNode = z.infer<typeof GraphNodeSchema>;
export type ValidatedGraphEdge = z.infer<typeof GraphEdgeSchema>;
