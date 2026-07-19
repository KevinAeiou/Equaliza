import { useEffect, useState } from "react"
import { ReportsService } from "../services/reports.services"
import { DashboardChartsProps } from "@/src/types"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"


export const useExpenseIncomeChart = (
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