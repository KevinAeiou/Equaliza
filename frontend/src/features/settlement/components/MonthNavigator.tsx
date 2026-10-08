"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { currentMonth, monthLabel, shiftMonth } from "../utils"

interface MonthNavigatorProps {
	month: string
	// Primeiro mês com acerto (`settlement_start`); antes dele não há dívida.
	start?: string
	onChange: (month: string) => void
}

export const MonthNavigator = ({ month, start, onChange }: MonthNavigatorProps) => (
	<div className="flex h-10 items-center justify-between rounded-lg border bg-card">
		<Button
			variant="ghost"
			size="icon"
			aria-label="Mês anterior"
			disabled={Boolean(start) && month <= (start as string)}
			onClick={() => onChange(shiftMonth(month, -1))}
		>
			<ChevronLeft />
		</Button>

		<span className="min-w-40 px-1 text-center text-sm font-medium tabular-nums">
			{monthLabel(month)}
		</span>

		<Button
			variant="ghost"
			size="icon"
			aria-label="Próximo mês"
			disabled={month >= currentMonth()}
			onClick={() => onChange(shiftMonth(month, 1))}
		>
			<ChevronRight />
		</Button>
	</div>
)
