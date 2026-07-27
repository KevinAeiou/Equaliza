import { Credentials, FormRegisterShemaType } from "@/src/types"
import { invitationApi } from "../../invitation/infra/invite"
import { authenticationApi } from "../infra/authentication"
import { ProfileFormSchemaType } from "@/src/schemas/profile.schema"


export class AuthService {
	static async login(credentials: Credentials) {
		await authenticationApi.login(credentials)

		const response = await authenticationApi.getUser()

		return response.data
	}

	static async getAuthenticatedUser() {
		const response = await authenticationApi.getUser()

		return response.data
	}

	static async logout() {
		await authenticationApi.logout()
	}

	static async isAuthenticated() {
		try {
			await authenticationApi.getUser()
			return true
		} catch {
			return false
		}
	}

	static async register(data: FormRegisterShemaType) {

		await authenticationApi.register(data)

	}

	static async validateInvitation(token: string) {
		const response = await invitationApi.validate(token)
		return {
			token: response.data.token,
			email: response.data.email,
			family: response.data.family,
		}
	}

	static async updateProfile(
		data: ProfileFormSchemaType,
	) {
		await authenticationApi.updateProfile(data)

		const response = await authenticationApi.getUser()

		return response.data
	}

	static async changeCurrentFamily(family_id: number) {
		await authenticationApi.changeCurrentFamily(family_id)
	}
}