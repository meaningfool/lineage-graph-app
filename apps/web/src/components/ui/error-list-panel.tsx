import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GraphError {
    id: string;
    type: "node" | "edge";
    message: string;
    label?: string;
    relatedIds?: string[]; // IDs of other elements involved (e.g., nodes in a cycle)
}

interface ErrorListPanelProps {
    errors: GraphError[];
    onClose: () => void;
    onItemClick?: (error: GraphError) => void;
}

export function ErrorListPanel({ errors, onClose, onItemClick }: ErrorListPanelProps) {
    return (
        <div
            data-testid="error-list-panel"
            className="absolute left-4 top-4 bottom-4 z-10 w-80 rounded-lg border bg-background p-4 shadow-lg transition-all animate-in slide-in-from-left flex flex-col"
        >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="font-semibold text-lg">Validation Errors</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                    data-testid="error-panel-close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <ul className="space-y-1">
                    {errors.map((error, index) => (
                        <li
                            key={`${error.id}-${index}`}
                            data-testid="error-item"
                            onClick={() => onItemClick?.(error)}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                        >
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0 fill-white" />
                            <div className="space-y-0.5">
                                <span className="text-foreground">
                                    {error.message}
                                </span>
                                {/* Optional: Show ID/Label if needed, but message usually contains it now */}
                                {/* <p className="text-xs text-muted-foreground">{error.id}</p> */}
                            </div>
                        </li>
                    ))}
                </ul>
                {errors.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No errors found.
                    </p>
                )}
            </div>
        </div>
    );
}
