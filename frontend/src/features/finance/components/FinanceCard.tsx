"use client"

import { Card, CardContent } from "@/src/components/ui/card"
import { useFinanceTable as useFinanceCard } from "../hooks/useFinanceTable"
import { FinanceEntryType } from "@/src/types"
import { DataTable } from "@/src/components/dataTable"

export interface FinanceCardProps {
	type: FinanceEntryType
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
	refresh: number
}

export const FinanceCard = ({
	type,
	setOpen,
	setFinanceId,
	refresh,
}: FinanceCardProps) => {
	const {
		table,
		loading,
	} = useFinanceCard({ type, setOpen, setFinanceId, refresh })

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