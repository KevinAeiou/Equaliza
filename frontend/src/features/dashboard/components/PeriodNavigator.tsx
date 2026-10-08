"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { formatPeriodLabel, shiftPeriod } from "../utils"

type PeriodFilters = Pick<FormDashboardFilterSchemaType, "type" | "period">

interface PeriodNavigatorProps<T extends PeriodFilters> {
	filters: T
	onChange: (filters: T) => void
}

export const PeriodNavigator = <T extends PeriodFilters>({
	filters,
	onChange,
}: PeriodNavigatorProps<T>) => {
	const move = (step: 1 | -1) =>
		onChange({
			...filters,
			period: shiftPeriod(filters.type, filters.period, step),
		})

	return (
		<div className="flex h-10 flex-1 items-center justify-between rounded-lg border bg-card sm:flex-none">
			<Button
				variant="ghost"
				size="icon"
				aria-label="Período anterior"
				onClick={() => move(-1)}
			>
				<ChevronLeft />
			</Button>

			<span className="min-w-36 px-1 text-center text-sm font-medium tabular-nums">
				{formatPeriodLabel(filters.type, filters.period)}
			</span>

			<Button
				variant="ghost"
				size="icon"
				aria-label="Próximo período"
				onClick={() => move(1)}
			>
				<ChevronRight />
			</Button>
		</div>
	)
}
