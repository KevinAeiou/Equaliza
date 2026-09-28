import { useEffect, useMemo, useState } from "react"
import { DashboardChartsProps } from "@/src/types"
import { ReportsService } from "../services/reports.services"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { buildTrend, getTrendPeriod } from "../utils"

// Os últimos 6 meses até o fim do período filtrado, independente do tipo de período escolhido.
export const useDashboardTrend = (
	filters: FormDashboardFilterSchemaType
) => {
	const [data, setData] = useState<DashboardChartsProps["income_vs_expense"]>()

	useEffect(() => {
		const loadTrend = async () => {
			const response = await ReportsService.getCharts({
				...filters,
				period: getTrendPeriod(filters.period),
			})

			setData(response.income_vs_expense)
		}

		loadTrend()
	}, [filters])

	const trend = useMemo(
		() => (data ? buildTrend(filters.period, data) : undefined),
		[data, filters.period]
	)

	return {
		trend,
	}
}
