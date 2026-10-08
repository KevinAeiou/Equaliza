import { DashboardParams } from "@/src/types"
import { reportsApi } from "../infra/reports.api"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { format } from "date-fns"

// `members` só existe na tela de finanças, que reaproveita o resumo do dashboard.
type SummaryFilters = FormDashboardFilterSchemaType & { members?: number[] }

const buildDashboardParams = (
	filters: SummaryFilters,
): DashboardParams => ({
	from_date: filters.period.from
		? format(filters.period.from, "yyyy-MM-dd")
		: undefined,

	to_date: filters.period.to
		? format(filters.period.to, "yyyy-MM-dd")
		: undefined,

	categories: filters.categories.length
		? filters.categories
		: undefined,

	members: filters.members?.length
		? filters.members
		: undefined,
})

export class ReportsService {

	static async getInsights(filters: FormDashboardFilterSchemaType) {
		const response = await reportsApi.getInsights({
			from_date: format(filters.period.from, "yyyy-MM-dd"),
			to_date: format(filters.period.to, "yyyy-MM-dd"),
			period_type: filters.type,
			categories: filters.categories.length ? filters.categories : undefined,
		})

		return response.data
	}

	static async getDashboardData(filters: FormDashboardFilterSchemaType) {
		const params = buildDashboardParams(filters)

		const [summary, charts, recentTransactions, memberBalances] =
			await Promise.all([
				reportsApi.getSummary(params),
				reportsApi.getCharts(params),
				reportsApi.getRecentTransactions(),
				reportsApi.getMemberBalances(),
			])

		return {
			summary: summary.data,
			charts: charts.data,
			recentTransactions: recentTransactions.data,
			memberBalances: memberBalances.data,
		}
	}

	static async getSummary(filters: SummaryFilters) {
		const params = buildDashboardParams(filters)

		const response = await reportsApi.getSummary(params)

		return response.data
	}

	static async getCharts(filters: FormDashboardFilterSchemaType) {
		const params = buildDashboardParams(filters)

		const response = await reportsApi.getCharts(params)

		return response.data
	}

	static async getRecentTransactions() {
		const response = await reportsApi.getRecentTransactions()

		return response.data
	}

	static async getMemberBalances() {
		const response = await reportsApi.getMemberBalances()

		return response.data
	}
}