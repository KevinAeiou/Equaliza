import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import {
	RecurringCreatePayload,
	RecurringProps,
	RecurringUpdatePayload,
} from "@/src/types"

const RecurringAPI = () => ({

	list: async (): Promise<RecurringProps[]> => {
		const response = await api<RecurringProps[]>({
			url: "finances/recurring/",
			method: "GET",
		})

		return response.data
	},

	retrieve: async (id: number): Promise<RecurringProps> => {
		try {
			const response = await api<RecurringProps>({
				url: `finances/recurring/${id}/`,
				method: "GET",
			})

			return response.data
		} catch (error) {
			throw configureError(error, "buscar recorrente")
		}
	},

	create: async (data: RecurringCreatePayload): Promise<void> => {
		try {
			await api({
				url: "finances/recurring/",
				method: "POST",
				data,
			})
		} catch (error) {
			throw configureError(error, "criar recorrente")
		}
	},

	update: async (id: number, data: RecurringUpdatePayload): Promise<void> => {
		try {
			await api({
				url: `finances/recurring/${id}/`,
				method: "PUT",
				data,
			})
		} catch (error) {
			throw configureError(error, "atualizar recorrente")
		}
	},

	delete: async (id: number): Promise<void> => {
		try {
			await api({
				url: `finances/recurring/${id}/`,
				method: "DELETE",
			})
		} catch (error) {
			throw configureError(error, "excluir recorrente")
		}
	},
})

export const recurringApi = RecurringAPI()
