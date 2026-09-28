"use client"

import { useState } from "react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
import { formatCurrency } from "@/src/lib/utils"
import { DashboardChartsProps } from "@/src/types"

const COLLAPSED_ITEMS = 5

interface CategoryBreakdownProps {
	data?: DashboardChartsProps["expenses_by_category"]
}

export const CategoryBreakdown = ({
	data,
}: CategoryBreakdownProps) => {
	const [expanded, setExpanded] = useState(false)

	const items = (data ?? []).map((item) => ({ ...item, value: Number(item.value) }))
	const total = items.reduce((sum, item) => sum + item.value, 0)
	const max = items[0]?.value ?? 0
	const visible = expanded ? items : items.slice(0, COLLAPSED_ITEMS)

	return (
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="font-semibold">Despesas por categoria</CardTitle>

				<CardDescription>
					{items.length ? `Total de ${formatCurrency(total)} no período` : "Nenhuma despesa no período"}
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				{visible.map((item) => (
					<div key={item.category} className="flex flex-col gap-1.5">
						<div className="flex items-baseline justify-between gap-3 text-sm">
							<span className="truncate">{item.category}</span>

							<span className="shrink-0 tabular-nums">
								<span className="font-medium">{formatCurrency(item.value)}</span>
								<span className="text-muted-foreground">
									{" "}· {Math.round((item.value / total) * 100)}%
								</span>
							</span>
						</div>

						<div className="h-2 rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-expense"
								style={{ width: `${max ? (item.value / max) * 100 : 0}%` }}
							/>
						</div>
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
