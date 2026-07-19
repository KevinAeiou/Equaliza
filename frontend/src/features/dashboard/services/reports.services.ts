import { DashboardParams } from "@/src/types"
import { reportsApi } from "../infra/reports.api"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { format } from "date-fns"

const buildDashboardParams = (
	filters: FormDashboardFilterSchemaType,
): DashboardParams => ({
	from: filters.period.from
		? format(filters.period.from, "yyyy-MM-dd")
		: undefined,

	to: filters.period.to
		? format(filters.period.to, "yyyy-MM-dd")
		: undefined,

	categories: filters.categories.length
		? filters.categories
		: undefined,
})

export class ReportsService {

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

	static async getSummary(filters: FormDashboardFilterSchemaType) {
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