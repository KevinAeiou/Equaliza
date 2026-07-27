import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { FamilyPayload, FamilyProps } from "@/src/types"

export const FamilyAPI = () => ({
	create: async (payload: FamilyPayload): Promise<FamilyProps> => {
		try {
			const response = await api<FamilyProps>({
				url: "families/",
				method: "POST",
				data: payload,
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "criar família")
		}
	},

	list: async (): Promise<FamilyProps[]> => {
		try {

			const response = await api<FamilyProps[]>({
				url: `families/`,
				method: `GET`,
			})

			return response.data

		} catch (error: unknown) {
			throw configureError(error, `listar famílias`)
		}
	},

	update: async (
		id: number,
		payload: FamilyPayload,
	): Promise<void> => {
		try {
			await api({
				url: `families/${id}/`,
				method: "PUT",
				data: payload,
			})
		} catch (error) {
			throw configureError(error, "atualizar família")
		}
	},

	delete: async (id: number): Promise<void> => {
		try {
			await api({
				url: `families/${id}/`,
				method: "DELETE",
			})
		} catch (error: unknown) {
			throw configureError(error, "excluir família")
		}
	},
})

export const familyApi = FamilyAPI()