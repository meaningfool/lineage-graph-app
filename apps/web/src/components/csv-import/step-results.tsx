import React from "react";
import { Button } from "@/components/ui/button";

interface StepResultsProps {
    feedback: { error: string | null; warnings: string[] };
    onClose: () => void;
}

export function StepResults({ feedback, onClose }: StepResultsProps) {
    return (
        <div className="space-y-4">
            {feedback.error ? (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {feedback.error}
                </div>
            ) : feedback.warnings.length > 0 ? (
                <div className="rounded-md bg-yellow-500/15 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                    <div className="font-semibold mb-1">{feedback.warnings[0]}</div>
                    {feedback.warnings.slice(1).map((warning, index) => (
                        <div key={index} className="text-xs mt-1">
                            {warning}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400">
                    Import successful
                </div>
            )}

            <div className="flex justify-end">
                <Button data-testid="import-close-button" onClick={onClose}>
                    Done
                </Button>
            </div>
        </div>
    );
}
