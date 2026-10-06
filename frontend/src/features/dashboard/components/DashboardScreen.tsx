"use client"

import { useState } from "react"
import { FilterButton } from "@/src/components/filters"
import { HeaderScreen } from "@/src/components/headerScreen"
import { useDashboardCategories } from "../hooks/useDashboardCategories"
import { useDashboardInsights } from "../hooks/useDashboardInsights"
import { useDashboardCharts } from "../hooks/useDashboardCharts"
import { useDashboardTrend } from "../hooks/useDashboardTrend"
import { getDefaultValues, FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { ActiveFilters } from "./ActiveFilters"
import { CategoryBreakdown } from "./CategoryBreakdown"
import { CategoryVsAverage } from "./CategoryVsAverage"
import { DashboardFilters } from "./DashboardFilters"
import { DashboardInsights } from "./DashboardInsights"
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

	const { categoryOptions, categoryGroups } = useDashboardCategories()
	const { chartData } = useDashboardCharts(filters)
	const { trend } = useDashboardTrend(filters)
	const { report: insights, error: insightsError, retry: retryInsights } = useDashboardInsights(filters)

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

					<FilterButton
						activeCount={filters.categories.length}
						onClick={() => setShowFilters((prev) => !prev)}
						compact
					/>
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

			<DashboardInsights
				report={insights}
				error={insightsError}
				onRetry={retryInsights}
			/>

			<div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
				<IncomeExpenseChart
					trend={trend}
					className="xl:col-span-2"
				/>

				{insights?.has_history && insights.comparisons.length > 0 ? (
					<CategoryVsAverage report={insights} />
				) : (
					<CategoryBreakdown
						data={chartData?.expenses_by_category}
					/>
				)}
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
				categoryGroups={categoryGroups}
				showFilter={showFilters}
				setShowFilter={setShowFilters}
				onApply={setFilters}
			/>
		</section>
	)
}
