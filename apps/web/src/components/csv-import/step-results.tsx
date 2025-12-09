import { Button } from "@/components/ui/button";

interface StepResultsProps {
	feedback: { error: string | null; warnings: string[] };
	onClose: () => void;
}

export function StepResults({ feedback, onClose }: StepResultsProps) {
	return (
		<div className="space-y-4">
			{feedback.error ? (
				<div className="rounded-md bg-destructive/15 p-3 text-destructive text-sm">
					{feedback.error}
				</div>
			) : feedback.warnings.length > 0 ? (
				<div className="rounded-md bg-yellow-500/15 p-3 text-sm text-yellow-700 dark:text-yellow-400">
					<div className="mb-1 font-semibold">{feedback.warnings[0]}</div>
					{feedback.warnings.slice(1).map((warning, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Static list
						<div key={index} className="mt-1 text-xs">
							{warning}
						</div>
					))}
				</div>
			) : (
				<div className="rounded-md bg-green-500/15 p-3 text-green-700 text-sm dark:text-green-400">
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
