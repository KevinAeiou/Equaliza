import Link from "next/link"
import { ChevronRight, Plus, Repeat } from "lucide-react"
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
		memberOptions,
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
				memberOptions={memberOptions}
				onChange={setFilters}
			/>

			<Link
				href="/finance/recurring"
				className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/60 sm:max-w-xl"
			>
				<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-income-soft text-income">
					<Repeat className="size-4" />
				</span>

				<span className="flex min-w-0 flex-1 flex-col">
					<span className="text-sm font-medium">Recorrentes</span>
					<span className="text-xs text-muted-foreground">
						Lançamentos que se repetem automaticamente
					</span>
				</span>

				<ChevronRight className="size-4 text-muted-foreground" />
			</Link>

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
