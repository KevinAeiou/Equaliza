import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { ApiResponse, DashboardChartsProps, DashboardParams, DashboardRecentTransactionProps, DashboardSummaryProps, MemberBalanceProps } from "@/src/types"

export const ReportsAPI = () => ({
	getSummary: async (
		params: DashboardParams,
	): Promise<ApiResponse<DashboardSummaryProps>> => {
		try {
			const response = await api({
				url: "reports/dashboard/summary/",
				params,
			})

			return {
				status: response.status,
				statusText: response.statusText,
				data: response.data,
			}
		} catch (error: unknown) {
			throw configureError(
				error,
				"buscar resumo do dashboard"
			)
		}
	},

	getCharts: async (
		params: DashboardParams,
	): Promise<ApiResponse<DashboardChartsProps>> => {
		try {
			const response = await api({
				url: "reports/dashboard/charts/",
				params,
			})

			return {
				status: response.status,
				statusText: response.statusText,
				data: response.data,
			}
		} catch (error: unknown) {
			throw configureError(error, "buscar gráficos do dashboard")
		}
	},

	getRecentTransactions: async (): Promise<ApiResponse<DashboardRecentTransactionProps[]>> => {
		try {
			const response = await api({
				url: "reports/dashboard/recent-transactions/",
			})

			return {
				status: response.status,
				statusText: response.statusText,
				data: response.data,
			}
		} catch (error: unknown) {
			throw configureError(
				error,
				"buscar últimas movimentações"
			)
		}
	},

	getMemberBalances: async (): Promise<ApiResponse<MemberBalanceProps[]>> => {
		try {
			const response = await api({
				url: "reports/dashboard/member-balances/",
			})

			return {
				status: response.status,
				statusText: response.statusText,
				data: response.data,
			}
		} catch (error: unknown) {
			throw configureError(
				error,
				"buscar saldo dos membros"
			)
		}
	},
})

export const reportsApi = ReportsAPI()