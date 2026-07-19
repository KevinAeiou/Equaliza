import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { MemberProps } from "@/src/types"

const MemberAPI = () => ({
	list: async (): Promise<MemberProps[]> => {
		try {

			const response = await api<MemberProps[]>({
				url: `families/members`,
				method: `GET`,
			})

			return response.data

		} catch (error: unknown) {
			throw configureError(error, `listar membros`)
		}
	},

	delete: async (id: number) => {
		try {
			await api({
				url: `families/members/${id}/`,
				method: "DELETE",
			})
		} catch (error: unknown) {
			throw configureError(error, "excluir membro")
		}
	},

	toggleStatus: async (id: number) => {
		try {
			await api({
				url: `families/members/${id}/status/`,
				method: "PATCH",
			})
		} catch (error: unknown) {
			throw configureError(error, "alternar estado do membro")
		}
	},
	
})

export const memberApi = MemberAPI()