"use client";
import { useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { CSVImportModal } from "./csv-import-modal";
import { TestFileUploadButton } from "./test-file-upload-button";

interface HeaderProps {
	onImport: (nodes: any[], edges: any[]) => void;
}

export default function Header({ onImport }: HeaderProps) {
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
					<TestFileUploadButton />
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
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
