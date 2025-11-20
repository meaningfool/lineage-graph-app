"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";
import { CSVImportModal } from "./csv-import-modal";

interface HeaderProps {
	onImport: (nodes: any[]) => void;
}

export default function Header({ onImport }: HeaderProps) {
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
					<CSVImportModal onImport={onImport} />
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
