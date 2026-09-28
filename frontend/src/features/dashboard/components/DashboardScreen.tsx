"use client"

import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { HeaderScreen } from "@/src/components/headerScreen"
import { useDashboardCategories } from "../hooks/useDashboardCategories"
import { useDashboardCharts } from "../hooks/useDashboardCharts"
import { useDashboardTrend } from "../hooks/useDashboardTrend"
import { getDefaultValues, FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { ActiveFilters } from "./ActiveFilters"
import { CategoryBreakdown } from "./CategoryBreakdown"
import { DashboardFilters } from "./DashboardFilters"
import { IncomeExpenseChart } from "./IncomeExpenseChart"
import { MemberBalance } from "./MemberBalance"
import { PeriodNavigator } from "./PeriodNavigator"
import { RecentTransactions } from "./RecentTransactions"
import { SummaryCards } from "./SummaryCards"

export const DashboardScreen = () => {
	const [showFilters, setShowFilters] = useState<boolean>(false)
	const [filters, setFilters] = useState<FormDashboardFilterSchemaType>(
		getDefaultValues()
	)

	const { categoryOptions } = useDashboardCategories()
	const { chartData } = useDashboardCharts(filters)
	const { trend } = useDashboardTrend(filters)

	const activeFilters = filters.categories.length

	return (
		<section className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Dashboard"
					subtitle="Acompanhe o resumo financeiro da sua família."
				/>

				<div className="flex gap-2">
					<PeriodNavigator
						filters={filters}
						onChange={setFilters}
					/>

					<Button
						variant="outline"
						className="h-10 gap-2"
						onClick={() => setShowFilters((prev) => !prev)}
						aria-label={activeFilters ? `Filtros, ${activeFilters} ativos` : "Filtros"}
					>
						<SlidersHorizontal size={16} />
						<span className="hidden sm:inline">Filtros</span>

						{activeFilters > 0 && (
							<span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
								{activeFilters}
							</span>
						)}
					</Button>
				</div>
			</div>

			<ActiveFilters
				filters={filters}
				categoryOptions={categoryOptions}
				onChange={setFilters}
			/>

			<SummaryCards
				filters={filters}
				trend={trend}
			/>

			<div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
				<IncomeExpenseChart
					trend={trend}
					className="xl:col-span-2"
				/>

				<CategoryBreakdown
					data={chartData?.expenses_by_category}
				/>
			</div>

			<div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
				<MemberBalance
					data={chartData?.member_contributions}
					className="xl:col-span-2"
				/>

				<RecentTransactions
					filters={filters}
				/>
			</div>

			<DashboardFilters
				filters={filters}
				categoryOptions={categoryOptions}
				showFilter={showFilters}
				setShowFilter={setShowFilters}
				onApply={setFilters}
			/>
		</section>
	)
}
