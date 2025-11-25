import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// --- PROPS ---
// This component needs to know:
// 1. What columns are available in the CSV files?
// 2. What is the current mapping?
// 3. Functions to call when the user changes something or clicks buttons.
interface StepMappingProps {
    columns: { nodes: string[]; edges: string[] };
    mapping: {
        id?: string;
        title?: string;
        type?: string;
        source?: string;
        target?: string;
    };
    // The parent (Wizard) handles the actual state update.
    // We just tell it "Hey, the user changed the 'id' field to 'User ID'".
    onChange: (field: "id" | "title" | "type" | "source" | "target", value: string | undefined) => void;
    onNext: () => void;
    onBack: () => void;
    isValid: boolean; // Can we proceed? (Are all fields mapped?)
    hasEdgesFile: boolean; // Did the user upload an edges file?
}

export function StepMapping({
    columns,
    mapping,
    onChange,
    onNext,
    onBack,
    isValid,
    hasEdgesFile,
}: StepMappingProps) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Map your CSV columns to the required fields.
            </p>

            {/* --- NODES MAPPING SECTION --- */}
            <div className="space-y-4 border rounded-md p-4">
                <h4 className="font-medium text-sm">Nodes</h4>
                <div className="grid gap-4">

                    {/* ID Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="mapping-id">Node ID</Label>
                        <select
                            id="mapping-id"
                            data-testid="mapping-select-id"
                            // Standard styling for a select input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={mapping.id || ""}
                            onChange={(e) => onChange("id", e.target.value || undefined)}
                        >
                            <option value="">Select column...</option>
                            {/* We map over the available columns to create options */}
                            {columns.nodes.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="mapping-title">Title</Label>
                        <select
                            id="mapping-title"
                            data-testid="mapping-select-title"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={mapping.title || ""}
                            onChange={(e) => onChange("title", e.target.value || undefined)}
                        >
                            <option value="">Select column...</option>
                            {columns.nodes.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="mapping-type">Type</Label>
                        <select
                            id="mapping-type"
                            data-testid="mapping-select-type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={mapping.type || ""}
                            onChange={(e) => onChange("type", e.target.value || undefined)}
                        >
                            <option value="">Select column...</option>
                            {columns.nodes.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- EDGES MAPPING SECTION --- */}
            {/* Only show this if the user actually uploaded an edges file */}
            {hasEdgesFile && (
                <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium text-sm">Edges</h4>
                    <div className="grid gap-4">

                        {/* Source Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="mapping-source">Source Node ID</Label>
                            <select
                                id="mapping-source"
                                data-testid="mapping-select-source"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={mapping.source || ""}
                                onChange={(e) => onChange("source", e.target.value || undefined)}
                            >
                                <option value="">Select column...</option>
                                {columns.edges.map((col) => (
                                    <option
                                        key={col}
                                        value={col}
                                        // Prevent selecting the same column for source and target?
                                        // Actually, here we just disable it if it's already selected as target.
                                        disabled={col === mapping.target}
                                    >
                                        {col}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Target Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="mapping-target">Target Node ID</Label>
                            <select
                                id="mapping-target"
                                data-testid="mapping-select-target"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={mapping.target || ""}
                                onChange={(e) => onChange("target", e.target.value || undefined)}
                            >
                                <option value="">Select column...</option>
                                {columns.edges.map((col) => (
                                    <option
                                        key={col}
                                        value={col}
                                        disabled={col === mapping.source}
                                    >
                                        {col}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NAVIGATION BUTTONS --- */}
            <div className="flex justify-end pt-4 gap-2">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button
                    data-testid="mapping-next-button"
                    onClick={onNext}
                    disabled={!isValid} // Disable "Next" until mapping is complete
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
