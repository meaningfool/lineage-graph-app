import { describe, expect, it } from "vitest";
import {
	buildGraphFromCsv,
	type ValidatedEdgeMapping,
	type ValidatedNodeMapping,
} from "./csv-graph-importer";

describe("CSV Graph Importer", () => {
	const defaultNodeMapping: ValidatedNodeMapping = {
		id: "id",
		title: "title",
		type: "type",
	};

	const defaultEdgeMapping: ValidatedEdgeMapping = {
		source: "source",
		target: "target",
	};

	describe("Node Processing", () => {
		it("should import valid nodes", () => {
			const nodesData = [
				{ id: "1", title: "Input Node", type: "INPUT" },
				{ id: "2", title: "Step Node", type: "STEP" },
			];
			// biome-ignore lint/suspicious/noExplicitAny: Test mock data
			const edgesData: any[] = [];

			const result = buildGraphFromCsv(nodesData, edgesData, {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.nodes).toHaveLength(2);
			expect(result.nodes[0]).toEqual({
				id: "1",
				title: "Input Node",
				type: "INPUT",
			});
			expect(result.nodes[1]).toEqual({
				id: "2",
				title: "Step Node",
				type: "STEP",
			});
			expect(result.report.nodes.errors).toHaveLength(0);
		});

		it("should normalize node types (case insensitive)", () => {
			const nodesData = [
				{ id: "1", title: "Input", type: "input" },
				{ id: "2", title: "Step", type: "Step" },
			];

			const result = buildGraphFromCsv(nodesData, [], {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.nodes[0].type).toBe("INPUT");
			expect(result.nodes[1].type).toBe("STEP");
		});

		it("should drop nodes with invalid types and report warning", () => {
			const nodesData = [
				{ id: "1", title: "Valid", type: "INPUT" },
				{ id: "2", title: "Invalid", type: "INVALID_TYPE" },
			];

			const result = buildGraphFromCsv(nodesData, [], {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.nodes).toHaveLength(1);
			expect(result.nodes[0].id).toBe("1");
			expect(result.report.nodes.droppedCount).toBe(1);
			expect(result.report.nodes.errors[0].id).toBe("ID: 2");
			expect(result.report.nodes.errors[0].message).toContain(
				"type: Invalid value. Must be one of: INPUT, STEP, OUTPUT",
			);
		});

		it("should deduplicate nodes by ID and report warning", () => {
			const nodesData = [
				{ id: "1", title: "First", type: "INPUT" },
				{ id: "1", title: "Duplicate", type: "INPUT" },
			];

			const result = buildGraphFromCsv(nodesData, [], {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.nodes).toHaveLength(1);
			expect(result.nodes[0].title).toBe("First");
			expect(result.report.nodes.droppedCount).toBe(1);
			expect(
				result.report.nodes.errors.some(
					(e) => e.id === "ID: 1" && e.message.includes("Duplicate Node ID"),
				),
			).toBe(true);
		});

		it("should import explicit properties", () => {
			const nodesData = [
				{
					id: "1",
					title: "Node",
					type: "INPUT",
					description: "My Description",
					cost: "100",
				},
			];

			const mapping: ValidatedNodeMapping = {
				...defaultNodeMapping,
				properties: ["description", "cost"],
			};

			const result = buildGraphFromCsv(nodesData, [], {
				nodes: mapping,
				edges: defaultEdgeMapping,
			});

			expect(result.nodes[0].properties).toEqual({
				description: "My Description",
				cost: "100",
			});
		});
	});

	describe("Edge Processing", () => {
		it("should import valid edges", () => {
			const nodesData = [
				{ id: "1", title: "A", type: "INPUT" },
				{ id: "2", title: "B", type: "OUTPUT" },
			];
			const edgesData = [{ source: "1", target: "2" }];

			const result = buildGraphFromCsv(nodesData, edgesData, {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]).toEqual({ source: "1", target: "2" });
		});

		it("should drop edges referencing missing nodes", () => {
			const nodesData = [{ id: "1", title: "A", type: "INPUT" }];
			const edgesData = [
				{ source: "1", target: "MISSING" }, // Target missing
				{ source: "MISSING", target: "1" }, // Source missing
			];

			const result = buildGraphFromCsv(nodesData, edgesData, {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.edges).toHaveLength(0);
			expect(result.report.edges.droppedCount).toBe(2);
			expect(
				result.report.edges.errors.some(
					(e) =>
						e.id === "Edge to ID: 1" &&
						e.message.includes("Source ID: 'MISSING' not found"),
				),
			).toBe(true);
		});

		it("should silently deduplicate identical edges", () => {
			const nodesData = [
				{ id: "1", title: "A", type: "INPUT" },
				{ id: "2", title: "B", type: "OUTPUT" },
			];
			const edgesData = [
				{ source: "1", target: "2" },
				{ source: "1", target: "2" },
			];

			const result = buildGraphFromCsv(nodesData, edgesData, {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			expect(result.edges).toHaveLength(1);
			// Deduplication is silent, so no warnings expected for this
			expect(result.report.edges.droppedCount).toBe(0);
		});
	});

	describe("Warning Limits", () => {
		it("should cap warnings at 50", () => {
			// biome-ignore lint/suspicious/noExplicitAny: Test mock data
			const nodesData: any[] = [];
			// Generate 60 invalid nodes
			for (let i = 0; i < 60; i++) {
				nodesData.push({ id: `bad-${i}`, title: "Bad", type: "INVALID" });
			}

			const result = buildGraphFromCsv(nodesData, [], {
				nodes: defaultNodeMapping,
				edges: defaultEdgeMapping,
			});

			// We expect 60 dropped nodes total
			expect(result.report.nodes.droppedCount).toBe(60);
			// But only 50 detailed errors stored
			expect(result.report.nodes.errors.length).toBe(50);
		});
	});
});
