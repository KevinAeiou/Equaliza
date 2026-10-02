"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { cn, formatCurrency } from "@/src/lib/utils"
import { FinanceEntryType } from "@/src/types"
import { useSummaryCards } from "../../dashboard/hooks/useSummaryCards"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"
import { FinanceCard } from "./FinanceCard"

interface FinanceTabsProps {
	refresh: number
	type: FinanceEntryType
	setType: (value: FinanceEntryType) => void
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
	filters: FormFinanceFilterSchemaType
}

export const FinanceTabs = ({
	refresh,
	type, setType,
	setOpen,
	setFinanceId,
	filters,
}: FinanceTabsProps) => {
	// Os totais ignoram o filtro de categorias, que vale só para o tipo exibido na tabela.
	const summaryFilters = useMemo(() => ({ ...filters, categories: [] }), [filters])
	const { loaded, income, expense } = useSummaryCards(summaryFilters, refresh)

	const tabs = [
		{ value: "INCOME" as const, label: "Receitas", total: income, icon: ArrowUpRight, iconClassName: "bg-income-soft text-income" },
		{ value: "EXPENSE" as const, label: "Despesas", total: expense, icon: ArrowDownRight, iconClassName: "bg-expense-soft text-expense-strong" },
	]

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div role="tablist" aria-label="Tipo de movimentação" className="grid grid-cols-2 gap-3 sm:max-w-xl">
				{tabs.map(({ value, label, total, icon: Icon, iconClassName }) => {
					const selected = type === value

					return (
						<button
							key={value}
							type="button"
							role="tab"
							aria-selected={selected}
							onClick={() => setType(value)}
							className={cn(
								"flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors sm:p-4",
								selected ? "border-primary ring-1 ring-primary" : "hover:bg-muted/60"
							)}
						>
							<span className={cn("hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex", iconClassName)}>
								<Icon className="size-4" />
							</span>

							<span className="flex min-w-0 flex-col">
								<span className="text-sm font-medium text-muted-foreground">{label}</span>

								{loaded ? (
									<span className="truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
										{formatCurrency(total)}
									</span>
								) : (
									<span className="my-1 h-5 w-24 animate-pulse rounded bg-muted" />
								)}
							</span>
						</button>
					)
				})}
			</div>

			<FinanceCard
				key={type}
				type={type}
				setOpen={setOpen}
				setFinanceId={setFinanceId}
				refresh={refresh}
				filters={filters}
			/>
		</div>
	)
}
