import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import {
	SettlementBalanceProps,
	SettlementHistoryParams,
	SettlementPayload,
	SettlementProps,
} from "@/src/types"

export const SettlementAPI = () => ({
	getBalance: async (month: string): Promise<SettlementBalanceProps> => {
		try {
			const response = await api<SettlementBalanceProps>({
				url: "settlements/balance/",
				params: { month },
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "buscar o saldo do acerto de contas")
		}
	},

	list: async (params: SettlementHistoryParams): Promise<SettlementProps[]> => {
		try {
			const response = await api<SettlementProps[]>({
				url: "settlements/",
				params,
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "buscar o histórico de acertos")
		}
	},

	create: async (payload: SettlementPayload): Promise<SettlementProps> => {
		try {
			const response = await api<SettlementProps>({
				url: "settlements/",
				method: "POST",
				data: payload,
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "registrar pagamento")
		}
	},

	cancel: async (id: number): Promise<SettlementProps> => {
		try {
			const response = await api<SettlementProps>({
				url: `settlements/${id}/cancel/`,
				method: "POST",
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "estornar pagamento")
		}
	},
})

export const settlementApi = SettlementAPI()
