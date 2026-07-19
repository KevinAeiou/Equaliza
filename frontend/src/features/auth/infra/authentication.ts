import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { ProfileFormSchemaType } from "@/src/schemas/profile.schema"
import { ApiResponse, Credentials, FormRegisterShemaType, UserProps } from "@/src/types"


export const AuthenticationAPI = () => ({
	login: async (credential: Credentials) => {
		try {
			await api({
				url: `login/`,
				method: `POST`,
				data: {
					email: credential.email,
					password: credential.password,
				},
			})
		} catch (error: unknown) {
			throw configureError(error, `autenticar`)
		}
	},

	getUser: async (): Promise<ApiResponse<UserProps>> => {
		try {
			const meResponse = await api({
				url: `me/`,
			})

			const userResponse = meResponse.data as UserProps

			return {
				status: 200,
				statusText: `Sucesso ao entrar`,
				data: userResponse,
			}
		} catch (error: unknown) {
			throw configureError(error, `pegar usuário`)
		}
	},

	logout: async () => {
		try {
			await api({
				url: `logout/`,
				method: `POST`,
			})
		} catch (error: unknown) {
			throw configureError(error, `sair`)
		}
	},

	register: async (data: FormRegisterShemaType) => {
		try {

			await api({
				url: `register/`,
				method: `POST`,
				data: {
					first_name: data.first_name,
					last_name: data.last_name,
					family_name: data.family_name,
					email: data.email,
					password: data.password,
					token: data.token,
				},
			})

		} catch (error: unknown) {
			throw configureError(error, `cadastrar usuário`)
		}
	},

	updateProfile: async (data: ProfileFormSchemaType) => {
		try {
			await api({
				url: `profile/`,
				method: `PATCH`,
				data: data
			})
		} catch (error: unknown) {
			throw configureError(error, `editar usuário`)
		}
	}

})

export const authenticationApi = AuthenticationAPI()