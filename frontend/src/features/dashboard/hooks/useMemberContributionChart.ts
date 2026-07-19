import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { useExpenseIncomeChart } from "./useExpenseIncomeChart"

export const useMemberContributionChart = (
	filters: FormDashboardFilterSchemaType
) => {
	const { chartData } = useExpenseIncomeChart(filters)

	return {
		chartData,
	}
}