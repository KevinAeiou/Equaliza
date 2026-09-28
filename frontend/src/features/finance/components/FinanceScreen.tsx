import { Plus } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { FilterButton } from "@/src/components/filters"
import { HeaderScreen } from "@/src/components/headerScreen"
import { ActiveFilters } from "../../dashboard/components/ActiveFilters"
import { PeriodNavigator } from "../../dashboard/components/PeriodNavigator"
import { countFinanceFilters } from "../hooks/useFinanceFilters"
import { useFinanceScreen } from "../hooks/useFinanceScreen"
import { FinanceDialog } from "./FinanceDialog"
import { FinanceFilters } from "./FinanceFilters"
import { FinanceTabs } from "./FinanceTabs"

export const FinanceScreen = () => {
	const {
		type,
		open, setOpen,
		refresh, setRefresh,
		financeId, setFinanceId,
		showFilter, setShowFilter,
		filters, setFilters,
		handleTypeChange,
		categoryOptions,
	} = useFinanceScreen()

	return (
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Finanças"
					subtitle="Gerencie as despesas e receitas da família."
				/>

				<div className="flex flex-wrap gap-2">
					<PeriodNavigator
						filters={filters}
						onChange={setFilters}
					/>

					<FilterButton
						activeCount={countFinanceFilters(filters)}
						onClick={() => setShowFilter((prev) => !prev)}
						compact
					/>

					<Button
						onClick={() => setOpen(true)}
						className="h-10 w-full gap-2 sm:w-auto"
					>
						<Plus className="size-4" />
						{type === "EXPENSE" ? "Nova despesa" : "Nova receita"}
					</Button>
				</div>
			</div>

			<ActiveFilters
				filters={filters}
				categoryOptions={categoryOptions}
				onChange={setFilters}
			/>

			<FinanceTabs
				refresh={refresh}
				type={type}
				setType={handleTypeChange}
				setOpen={setOpen}
				setFinanceId={setFinanceId}
				filters={filters}
			/>

			<FinanceDialog
				type={type}
				open={open}
				setOpen={setOpen}
				financeId={financeId}
				setFinanceId={setFinanceId}
				onSuccess={() => setRefresh((v) => v + 1)}
			/>

			<FinanceFilters
				type={type}
				filters={filters}
				showFilter={showFilter}
				setShowFilter={setShowFilter}
				onApply={setFilters}
			/>
		</section>
	)
}
