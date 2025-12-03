import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorListPanelProps {
    onClose: () => void;
}

export function ErrorListPanel({ onClose }: ErrorListPanelProps) {
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
            <div className="flex-grow">
                {/* Content will go here in Slice 3 */}
                <p className="text-sm text-muted-foreground">Error list placeholder</p>
            </div>
        </div>
    );
}
