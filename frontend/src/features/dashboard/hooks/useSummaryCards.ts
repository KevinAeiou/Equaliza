import { formatCurrency } from "@/src/lib/utils"
import { DashboardSummaryProps } from "@/src/types"
import { ArrowDownCircle, ArrowUpCircle, Users, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { ReportsService } from "../services/reports.services"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

export const useSummaryCards = (
	filters: FormDashboardFilterSchemaType
) => {

	const [summary, setSummary] = useState<DashboardSummaryProps>()

	useEffect(() => {
		const loadSummary = async () => {
			const data = await ReportsService.getSummary(filters)
			setSummary(data)
		}

		loadSummary()
	}, [filters])

	const cards = summary
		? [
			{
				title: "Saldo",
				description: "Disponível",
				value: formatCurrency(summary?.balance ?? 0),
				icon: Wallet,
			},
			{
				title: "Receitas",
				description: "Este mês",
				value: formatCurrency(summary?.income ?? 0),
				icon: ArrowUpCircle,
			},
			{
				title: "Despesas",
				description: "Este mês",
				value: formatCurrency(summary?.expense ?? 0),
				icon: ArrowDownCircle,
			},
			{
				title: "Membros",
				description: "Família ativa",
				value: String(summary?.members ?? 0),
				icon: Users,
			},
		]
		: []

	return {
		cards,
	}
}