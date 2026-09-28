"use client"

import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface FilterButtonProps {
	activeCount: number
	onClick: () => void
	className?: string
	compact?: boolean
}

export const FilterButton = ({
	activeCount,
	onClick,
	className,
	compact = false,
}: FilterButtonProps) => (
	<Button
		variant="outline"
		className={cn("h-10 gap-2", className)}
		onClick={onClick}
		aria-label={activeCount ? `Filtros, ${activeCount} ativos` : "Filtros"}
	>
		<SlidersHorizontal size={16} />
		<span className={cn(compact && "hidden sm:inline")}>Filtros</span>

		{activeCount > 0 && (
			<span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
				{activeCount}
			</span>
		)}
	</Button>
)
