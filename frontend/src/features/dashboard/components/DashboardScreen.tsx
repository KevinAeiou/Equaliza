"use client"

import { SlidersHorizontal } from "lucide-react"
import { ExpenseIncomeChart } from "./ExpenseIncomeChart"
import { MemberContributionChart } from "./MemberContributionChart"
import { SummaryCards } from "./SummaryCards"
import { Button } from "@/src/components/ui/button"
import { useState } from "react"
import { DashboardFilters } from "./DashboardFilters"
import { getDefaultValues as getDefaultValues, FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { HeaderScreen } from "@/src/components/headerScreen"

export const DashboardScreen = () => {
	const [showFilters, setShowFilters] = useState<boolean>(false)
	const [filters, setFilters] = useState<FormDashboardFilterSchemaType>(
		getDefaultValues()
	)

	return (
		<section className="flex flex-col gap-4">
			<HeaderScreen
				title="Dashboard"
				subtitle="Acompanhe o resumo financeiro da sua família."
			>
				<Button
					variant="outline"
					className="gap-2"
					onClick={() => setShowFilters((prev) => !prev)}
				>
					<SlidersHorizontal size={16} />
					Filtros
				</Button>
			</HeaderScreen>

			<SummaryCards
				filters={filters}
			/>

			<MemberContributionChart
				filters={filters}
			/>

			<ExpenseIncomeChart
				filters={filters}
			/>

			<DashboardFilters
				showFilter={showFilters}
				setShowFilter={setShowFilters}
				onApply={setFilters}
			/>
		</section>
	)
}