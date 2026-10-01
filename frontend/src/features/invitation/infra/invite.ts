import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { ApiResponse, FamilyProps, InviteProps, InviteValidationProps } from "@/src/types"

export const InvitationAPI = () => ({
	create: async (email: string) => {
		try {
			const response = await api({
				url: "invitations/",
				method: "POST",
				data: {
					email,
				},
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "criar convite")
		}
	},

	validate: async (token: string): Promise<ApiResponse<InviteValidationProps>> => {
		try {

			const response = await api<ApiResponse<InviteValidationProps>>({
				url: `invitations/${token}/validate/`,
				method: `GET`,
			})

			return response.data

		} catch (error: unknown) {
			throw configureError(error, `validar convite`)
		}
	},

	accept: async (token: string): Promise<FamilyProps> => {
		try {
			const response = await api<ApiResponse<{ family: FamilyProps }>>({
				url: `invitations/${token}/accept/`,
				method: "POST",
			})

			return response.data.data.family
		} catch (error: unknown) {
			throw configureError(error, "aceitar convite")
		}
	},

	list: async (): Promise<InviteProps[]> => {
		try {

			const response = await api<InviteProps[]>({
				url: `invitations/`,
				method: `GET`,
			})

			return response.data

		} catch (error: unknown) {
			throw configureError(error, `listar convites`)
		}
	},

	delete: async (id: number) => {
		try {
			await api({
				url: `invitations/${id}/`,
				method: "DELETE",
			})
		} catch (error: unknown) {
			throw configureError(error, "excluir convite")
		}
	},
})

export const invitationApi = InvitationAPI()