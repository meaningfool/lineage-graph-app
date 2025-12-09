import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ErrorToggleProps {
	errorCount: number;
	onClick: () => void;
}

export function ErrorToggle({ errorCount, onClick }: ErrorToggleProps) {
	if (errorCount === 0) return null;

	return (
		<Button
			variant="outline"
			size="sm"
			className="absolute top-4 left-4 z-10 gap-2 border-red-200 bg-background shadow-sm hover:bg-red-50 hover:text-red-900"
			onClick={onClick}
			data-testid="error-toggle"
		>
			<AlertCircle className="h-4 w-4 text-red-500" />
			<span className="font-medium text-red-900">Errors</span>
			<Badge variant="destructive" className="h-5 min-w-5 px-1.5">
				{errorCount}
			</Badge>
		</Button>
	);
}
