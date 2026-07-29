"use client"

import { Card, CardContent } from "@/src/components/ui/card"
import { useFinanceCard } from "../hooks/useFinanceTable"
import { FinanceEntryType } from "@/src/types"
import { DataTable } from "@/src/components/dataTable"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"

export interface FinanceCardProps {
	type: FinanceEntryType
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
	refresh: number
	filters: FormFinanceFilterSchemaType
}

export const FinanceCard = ({
	type,
	setOpen,
	setFinanceId,
	refresh,
	filters,
}: FinanceCardProps) => {
	const {
		table,
		loading,
	} = useFinanceCard({ type, setOpen, setFinanceId, refresh, filters })

	return (
		<Card className="flex h-full flex-1 flex-col overflow-hidden">
			<CardContent className="flex-1 overflow-hidden p-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhuma movimentação encontrada."
				/>
			</CardContent>
		</Card>
	)
}