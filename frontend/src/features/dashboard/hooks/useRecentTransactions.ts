import { useEffect, useState } from "react"
import { FinanceEntryType } from "@/src/types"
import { FinanceService } from "../../finance/services/financial.service"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

const LIMIT = 5

export interface RecentTransaction {
	id: string
	description: string
	category: string
	date: string
	amount: number
	type: FinanceEntryType
	author?: string
}

export const useRecentTransactions = (
	filters: FormDashboardFilterSchemaType
) => {
	const [transactions, setTransactions] = useState<RecentTransaction[]>()

	useEffect(() => {
		const loadTransactions = async () => {
			const [incomes, expenses] = await Promise.all([
				FinanceService.list("INCOME", filters),
				FinanceService.list("EXPENSE", filters),
			])

			const entries = [
				...incomes.map((item) => ({ item, type: "INCOME" as const })),
				...expenses.map((item) => ({ item, type: "EXPENSE" as const })),
			]

			setTransactions(
				entries
					.sort((a, b) =>
						b.item.date.localeCompare(a.item.date) ||
						(b.item.created_at ?? "").localeCompare(a.item.created_at ?? "")
					)
					.slice(0, LIMIT)
					.map(({ item, type }) => ({
						id: `${type}-${item.id}`,
						description: item.description || item.category.name,
						category: item.category.name,
						date: item.date,
						amount: Number(item.amount),
						type,
						author: item.created_by?.name.split(" ")[0],
					}))
			)
		}

		loadTransactions()
	}, [filters])

	return {
		transactions,
	}
}
