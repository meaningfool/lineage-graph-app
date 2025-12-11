"use client";
import { Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CSVImportModal } from "./csv-import-modal";
import { ModeToggle } from "./mode-toggle";
import { ImportWizardDialog } from "./wizard/import-wizard-dialog";

interface HeaderProps {
	onImport: (nodes: any[], edges: any[]) => void;
}

export default function Header({ onImport }: HeaderProps) {
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [isWizardOpen, setIsWizardOpen] = useState(false);
	const links = [{ to: "/", label: "Home" }];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} href={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
						<Upload className="mr-2 h-4 w-4" />
						Import CSV
					</Button>
					{isImportModalOpen && (
						<CSVImportModal
							onImport={onImport}
							onClose={() => setIsImportModalOpen(false)}
						/>
					)}
					<Button
						variant="default"
						size="sm"
						className="bg-indigo-600 text-white hover:bg-indigo-700"
						onClick={() => setIsWizardOpen(true)}
					>
						✨ New Import
					</Button>
					{isWizardOpen && (
						<ImportWizardDialog
							key={isWizardOpen ? "open" : "closed"}
							isOpen={isWizardOpen}
							onClose={() => setIsWizardOpen(false)}
							onImport={onImport}
						/>
					)}
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
