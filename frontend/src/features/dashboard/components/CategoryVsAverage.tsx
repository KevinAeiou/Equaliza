"use client"

import { useState } from "react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
import { cn, formatCurrency } from "@/src/lib/utils"
import { DashboardInsightsReportProps } from "@/src/types"

const COLLAPSED_ITEMS = 5

interface CategoryVsAverageProps {
	report: DashboardInsightsReportProps
}

const getBarColor = (change: number | null) => {
	if (change === null || Math.abs(change) < 0.05) return "bg-muted-foreground"
	if (change < 0) return "bg-income"

	return change >= 0.3 ? "bg-destructive" : "bg-expense"
}

const ChangeChip = ({ change }: { change: number | null }) => {
	const percent = change === null ? 0 : Math.round(Math.abs(change) * 100)

	const [label, className] =
		change === null
			? ["sem média", "bg-muted text-muted-foreground"]
			: Math.abs(change) < 0.05
				? ["na média", "bg-muted text-muted-foreground"]
				: change < 0
					? [`↓ ${percent}%`, "bg-income-soft text-income"]
					: change >= 0.3
						? [`↑ ${percent}%`, "bg-destructive/10 text-destructive"]
						: [`↑ ${percent}%`, "bg-expense-soft text-expense-strong"]

	return (
		<span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", className)}>
			{label}
		</span>
	)
}

// Cada categoria da despesa com uma marca na média dos períodos anteriores.
export const CategoryVsAverage = ({ report }: CategoryVsAverageProps) => {
	const [expanded, setExpanded] = useState(false)

	const items = report.comparisons
	const visible = expanded ? items : items.slice(0, COLLAPSED_ITEMS)
	const scale = Math.max(...items.flatMap((item) => [item.value, item.average ?? 0]), 0)

	return (
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="font-semibold">Categorias frente à média</CardTitle>

				<CardDescription>
					A marca vertical é a média {report.average_label}.
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				{visible.map((item) => (
					<div key={item.name} className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between gap-3 text-sm">
							<span className="truncate">{item.name}</span>

							<span className="flex shrink-0 items-center gap-2">
								<span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
								<ChangeChip change={item.change} />
							</span>
						</div>

						<div className="relative h-2 rounded-full bg-muted">
							<div
								className={cn("h-full rounded-full", getBarColor(item.change))}
								style={{ width: `${scale ? (item.value / scale) * 100 : 0}%` }}
							/>

							{item.average !== null && scale > 0 && (
								<div
									className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground"
									style={{ left: `calc(${(item.average / scale) * 100}% - 1px)` }}
								/>
							)}
						</div>

						<span className="text-xs text-muted-foreground">
							{item.average === null
								? "Sem histórico nesta categoria"
								: `Média ${formatCurrency(item.average)}`}
						</span>
					</div>
				))}

				{items.length > COLLAPSED_ITEMS && (
					<button
						type="button"
						onClick={() => setExpanded((prev) => !prev)}
						className="self-start text-sm font-medium text-income hover:underline"
					>
						{expanded ? "Mostrar menos" : `Ver as ${items.length} categorias`}
					</button>
				)}
			</CardContent>
		</Card>
	)
}
