import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
    children: React.ReactNode
    content: string
    className?: string
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={cn(
                        "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-md whitespace-nowrap",
                        "bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mb-1", // Position above
                        className
                    )}
                >
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    )
}
