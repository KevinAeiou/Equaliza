import { familyApi } from "../infra/family"
import { FormFamilySchemaType } from "../schemas/family.shema"

export class FamilyService {

	static async list() {
		const response = await familyApi.list()

		return response
	}

	static async create(data: FormFamilySchemaType) {
		return await familyApi.create(data)
	}

	static async delete(id: number) {
		await familyApi.delete(id)
	}

	static async update(id: number, data: FormFamilySchemaType) {
		await familyApi.update(id, data)
	}
}