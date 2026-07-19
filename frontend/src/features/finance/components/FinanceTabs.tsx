import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { FinanceCard } from "./FinanceCard"
import { FinanceEntryType } from "@/src/types"

interface FinanceTabsProps {
	refresh: number
	type: FinanceEntryType
	setType: (value: FinanceEntryType) => void
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
}

export const FinanceTabs = ({
	refresh,
	type, setType,
	setOpen,
	setFinanceId,
}: FinanceTabsProps) => {

	return (
		<Tabs
			defaultValue="EXPENSE"
			className="w-full h-full items-center"
			value={type}
			onValueChange={(value) => setType(value as FinanceEntryType)}
		>
			<TabsList variant="line">
				<TabsTrigger value="EXPENSE">Despesas</TabsTrigger>

				<TabsTrigger value="INCOME">Renda</TabsTrigger>
			</TabsList>

			<TabsContent
				value="EXPENSE"
				className="w-full"
			>
				<FinanceCard
					type="EXPENSE"
					setOpen={setOpen}
					setFinanceId={setFinanceId}
					refresh={refresh}
				/>
			</TabsContent>
			<TabsContent
				value="INCOME"
				className="w-full h-full"
			>
				<FinanceCard
					type="INCOME"
					setOpen={setOpen}
					setFinanceId={setFinanceId}
					refresh={refresh}
				/>
			</TabsContent>
		</Tabs>
	)
}