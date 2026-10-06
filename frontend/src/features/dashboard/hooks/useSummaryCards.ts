import { DashboardSummaryProps } from "@/src/types"
import { useEffect, useState } from "react"
import { ReportsService } from "../services/reports.services"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

export const useSummaryCards = (
	filters: FormDashboardFilterSchemaType,
	refresh = 0,
) => {
	const [summary, setSummary] = useState<DashboardSummaryProps>()

	useEffect(() => {
		const loadSummary = async () => {
			const data = await ReportsService.getSummary(filters)
			setSummary(data)
		}

		loadSummary()
	}, [filters, refresh])

	// A API envia os valores decimais como texto.
	const income = Number(summary?.income ?? 0)
	const expense = Number(summary?.expense ?? 0)

	return {
		loaded: Boolean(summary),
		income,
		expense,
	}
}
