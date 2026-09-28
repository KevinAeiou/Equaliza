import { useEffect, useState } from "react"
import { DashboardChartsProps } from "@/src/types"
import { ReportsService } from "../services/reports.services"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

export const useDashboardCharts = (
	filters: FormDashboardFilterSchemaType
) => {
	const [chartData, setChartData] = useState<DashboardChartsProps>()

	useEffect(() => {
		const loadCharts = async () => {
			const data = await ReportsService.getCharts(filters)
			setChartData(data)
		}

		loadCharts()
	}, [filters])

	return {
		chartData,
	}
}
