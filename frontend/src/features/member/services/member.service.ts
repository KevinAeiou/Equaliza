import { memberApi } from "../infra/member"

export class MemberService {

	static async list() {
		const response = await memberApi.list()

		return response
	}

	static async delete(id: number) {
		await memberApi.delete(id)
	}
	static async toggleStatus(id: number) {
		await memberApi.toggleStatus(id)
	}
}