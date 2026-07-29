import { Button } from "@/src/components/ui/button"
import { Plus, SlidersHorizontal } from "lucide-react"
import { FinanceTabs } from "./FinanceTabs"
import { useFinanceScreen } from "../hooks/useFinanceScreen"
import { FinanceDialog } from "./FinanceDialog"
import { HeaderScreen } from "@/src/components/headerScreen"
import { FinanceFilters } from "./FinanceFilters"

export const FinanceScreen = () => {
	const {
		type,
		open, setOpen,
		refresh, setRefresh,
		financeId, setFinanceId,
		showFilter, setShowFilter,
		filters, setFilters,
		handleTypeChange,
	} = useFinanceScreen()

	return (
		<section className="flex h-full flex-col gap-2">
			<HeaderScreen
				title="Finanças"
				subtitle="Gerencie despesas e receitas da família."
			>
				<Button
					variant="outline"
					className="gap-2 w-full sm:w-auto"
					onClick={() => setShowFilter((prev) => !prev)}
				>
					<SlidersHorizontal size={16} />
					Filtros
				</Button>
			</HeaderScreen>

			<div className="flex justify-end w-full">
				<Button
					onClick={() => setOpen(true)}
					className="gap-2 w-full sm:w-auto"
				>
					<Plus className="mr-2 h-4 w-4" />
					Nova movimentação
				</Button>
			</div>

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
				showFilter={showFilter}
				setShowFilter={setShowFilter}
				onApply={setFilters}
			/>
		</section >
	)
}