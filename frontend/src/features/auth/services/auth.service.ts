import { Credentials, FormRegisterShemaType } from "@/src/types"
import { invitationApi } from "../../invitation/infra/invite"
import { authenticationApi } from "../infra/authentication"
import { ProfileFormSchemaType } from "@/src/features/profile/schemas/profile.schema"


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

	static async requestPasswordReset(email: string) {
		await authenticationApi.requestPasswordReset(email)
	}

	static async confirmPasswordReset(uid: string, token: string, password: string) {
		await authenticationApi.confirmPasswordReset(uid, token, password)
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