import { CategoryParams } from "@/src/types"
import { categoryApi } from "../infra/category"
import { FormCategorySchemaType } from "../schemas/category.schema"
import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"

export class CategoryService {

	static async list(filters: FormCategoryFilterSchemaType) {
		const params: CategoryParams = {
			name: filters.name,
			type: filters.type
		}

		const response = await categoryApi.list(params)

		return response
	}

	static async create(data: FormCategorySchemaType) {
		return await categoryApi.create(data)
	}

	static async delete(id: number) {
		await categoryApi.delete(id)
	}

	static async update(id: number, data: FormCategorySchemaType) {
		await categoryApi.update(id, data)
	}
}