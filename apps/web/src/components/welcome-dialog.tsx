import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onStart: () => void;
	onDemoStart: () => void;
}

export function WelcomeDialog({
	isOpen,
	onClose,
	onStart,
	onDemoStart,
}: WelcomeDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="duration-0 data-[state=open]:animate-none sm:max-w-md"
				overlayClassName="duration-0 data-[state=open]:animate-none"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				showCloseButton={false}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-2xl">
						<Rocket className="h-6 w-6 text-indigo-600" />
						Welcome to DataLineage
					</DialogTitle>
					<DialogDescription className="pt-2 text-base">
						Visualize and validate your data dependencies with ease. Import your
						CSV files to generate an interactive lineage graph.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<img
						src="/images/how-it-works.png"
						alt="How it works"
						className="h-auto w-full rounded-lg border shadow-sm"
					/>
				</div>
				<div className="py-4">
					<ul className="list-inside list-disc space-y-2 text-muted-foreground text-sm">
						<li>Import Nodes and Edges via CSV</li>
						<li>Automatic cycle detection and validation</li>
						<li>Interactive graph exploration</li>
					</ul>
				</div>
				<DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
					<Button
						type="button"
						className="w-full bg-indigo-600 hover:bg-indigo-700"
						onClick={onStart}
						data-testid="welcome-start-button"
					>
						Upload My Own Data
					</Button>

					<div className="relative flex items-center py-2">
						<span className="w-full border-t" />
						<span className="px-2 text-muted-foreground text-xs uppercase">
							Or
						</span>
						<span className="w-full border-t" />
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full text-muted-foreground hover:text-foreground"
						onClick={onDemoStart}
						data-testid="welcome-demo-button"
					>
						Try with chemical-lineage.csv
					</Button>

					<div className="relative flex items-center py-2">
						<span className="w-full border-t" />
						<span className="px-2 text-muted-foreground text-xs uppercase">
							Or
						</span>
						<span className="w-full border-t" />
					</div>

					<p className="text-center text-muted-foreground text-sm">
						Download{" "}
						<a
							href="/demo/chemical-lineage.zip"
							download
							className="text-indigo-600 underline hover:text-indigo-800"
						>
							chemical-lineage.csv
						</a>
						<br />
						to try the upload wizard for yourself.
					</p>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
