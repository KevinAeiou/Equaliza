import { invitationApi } from "../infra/invite"

export class InvitationService {

	static async list() {
		const response = await invitationApi.list()

		return response
	}

	static async delete(id: number) {
		await invitationApi.delete(id)
	}
}