"use client"

import { Card, CardContent } from "@/src/components/ui/card"
import { useFinanceCard } from "../hooks/useFinanceCard"
import { FinanceEntryType } from "@/src/types"
import { DataTable } from "@/src/components/dataTable"
import { formatCurrency } from "@/src/lib/utils"
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
		count,
		total,
	} = useFinanceCard({ type, setOpen, setFinanceId, refresh, filters })

	const entries = type === "EXPENSE" ? "despesa" : "receita"

	return (
		<Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
			<CardContent className="flex min-h-0 flex-1 flex-col px-2 sm:px-4">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage={`Nenhuma ${entries} no período.`}
				/>
			</CardContent>

			{!loading && count > 0 && (
				<div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground sm:px-6">
					<span>
						{count} {count === 1 ? entries : `${entries}s`}
					</span>

					<span>
						Total <span className="font-semibold text-foreground tabular-nums">{formatCurrency(total)}</span>
					</span>
				</div>
			)}
		</Card>
	)
}
