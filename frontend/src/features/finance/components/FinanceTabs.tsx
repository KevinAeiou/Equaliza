import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { FinanceCard } from "./FinanceCard"
import { FinanceEntryType } from "@/src/types"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"

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
					filters={filters}
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
					filters={filters}
				/>
			</TabsContent>
		</Tabs>
	)
}