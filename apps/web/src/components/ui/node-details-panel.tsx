import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NodeDetailsPanelProps {
    node: {
        id: string;
        data: {
            label: string;
            type: string;
            properties?: Record<string, any>;
        };
    };
    onClose: () => void;
    isFocused: boolean;
    onToggleFocus: () => void;
}

export function NodeDetailsPanel({ node, onClose, isFocused, onToggleFocus }: NodeDetailsPanelProps) {
    const { label, type, properties } = node.data;

    return (
        <div
            data-testid="node-details-panel"
            className="absolute right-4 top-4 bottom-4 z-10 w-80 rounded-lg border bg-background p-4 shadow-lg transition-all animate-in slide-in-from-right flex flex-col"
        >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="font-semibold text-lg">{label}</h3>
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFocus}
                        data-testid="focus-toggle"
                        data-active={isFocused}
                        className="mr-2"
                    >
                        {isFocused ? "Clear Focus" : "Focus Subtree"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto flex-grow">
                {properties && Object.keys(properties).length > 0 && (
                    <div className="space-y-2">
                        {Object.entries(properties).map(([key, value]) => (
                            <div key={key} className="text-sm grid grid-cols-3 gap-2">
                                <span className="font-medium capitalize col-span-1">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <span className="text-muted-foreground col-span-2 break-words">
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
