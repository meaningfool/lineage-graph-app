import { Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ImportWizardDialog } from "./wizard/import-wizard-dialog";

interface HeaderProps {
	onImport: (nodes: any[], edges: any[]) => void;
	isWizardOpen: boolean;
	setIsWizardOpen: (open: boolean) => void;
}

export default function Header({
	onImport,
	isWizardOpen,
	setIsWizardOpen,
}: HeaderProps) {
	const links = [{ to: "/", label: "Home" }];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-2">
				<div className="flex items-center gap-6">
					<Link href="/" className="flex items-center gap-2 hover:opacity-80">
						<div className="relative h-8 w-8 overflow-hidden rounded-md">
							<img
								src="/nano-banana.png"
								alt="Nano Banana Logo"
								className="h-full w-full object-cover"
							/>
						</div>
						<span className="font-bold text-foreground text-xl tracking-tight">
							DataLineage
						</span>
					</Link>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => setIsWizardOpen(true)}
						data-testid="import-csv-trigger"
					>
						<Upload className="mr-2 h-4 w-4" />
						Import CSV
					</Button>
					{isWizardOpen && (
						<ImportWizardDialog
							key={isWizardOpen ? "open" : "closed"}
							isOpen={isWizardOpen}
							onClose={() => setIsWizardOpen(false)}
							onImport={onImport}
						/>
					)}
				</div>
			</div>
			<hr />
		</div>
	);
}
