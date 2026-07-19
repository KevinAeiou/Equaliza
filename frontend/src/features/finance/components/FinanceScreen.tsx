import { Button } from "@/src/components/ui/button"
import { Plus } from "lucide-react"
import { FinanceTabs } from "./FinanceTabs"
import { useFinanceScreen } from "../hooks/useFinanceScreen"
import { FinanceDialog } from "./FinanceDialog"
import { HeaderScreen } from "@/src/components/headerScreen"


export const FinanceScreen = () => {
	const {
		type, setType,
		open, setOpen,
		refresh, setRefresh,
		financeId, setFinanceId,
	} = useFinanceScreen()

	return (
		<section className="flex h-full flex-col gap-4">
			<HeaderScreen
				title="Finanças"
				subtitle="Gerencie despesas e receitas da família."
			>
				<Button
					onClick={() => setOpen(true)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Nova movimentação
				</Button>
			</HeaderScreen>

			{/* <FinanceFilters /> */}

			<FinanceTabs
				refresh={refresh}
				type={type}
				setType={setType}
				setOpen={setOpen}
				setFinanceId={setFinanceId}
			/>

			<FinanceDialog
				type={type}
				open={open}
				setOpen={setOpen}
				financeId={financeId}
				setFinanceId={setFinanceId}
				onSuccess={() => setRefresh((v) => v + 1)}
			/>
		</section >
	)
}