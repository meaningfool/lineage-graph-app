import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GraphError {
    id: string;
    type: "node" | "edge";
    message: string;
    label?: string;
}

interface ErrorListPanelProps {
    errors: GraphError[];
    onClose: () => void;
}

export function ErrorListPanel({ errors, onClose }: ErrorListPanelProps) {
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
            <div className="flex-grow overflow-y-auto space-y-2">
                {errors.map((error, index) => (
                    <div
                        key={`${error.id}-${index}`}
                        data-testid="error-item"
                        className="p-3 rounded-md border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {error.label || error.id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {error.message}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                    {error.type}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {errors.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No errors found.
                    </p>
                )}
            </div>
        </div>
    );
}
