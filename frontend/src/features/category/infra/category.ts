import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import { CategoryParams, CategoryPayload, CategoryProps } from "@/src/types"

export const CategoryAPI = () => ({
	create: async (payload: CategoryPayload): Promise<CategoryProps> => {
		try {
			const response = await api<CategoryProps>({
				url: "finances/categories/",
				method: "POST",
				data: payload,
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "criar categoria")
		}
	},

	list: async (params: CategoryParams): Promise<CategoryProps[]> => {
		try {
			const response = await api<CategoryProps[]>({
				url: "finances/categories/",
				method: "GET",
				params,
			})

			return response.data
		} catch (error: unknown) {
			throw configureError(error, "listar categorias")
		}
	},

	update: async (
		id: number,
		payload: CategoryPayload,
	): Promise<void> => {
		try {
			await api({
				url: `finances/categories/${id}/`,
				method: "PUT",
				data: payload,
			})
		} catch (error: unknown) {
			throw configureError(error, "atualizar categoria")
		}
	},

	delete: async (id: number): Promise<void> => {
		try {
			await api({
				url: `finances/categories/${id}/`,
				method: "DELETE",
			})
		} catch (error: unknown) {
			throw configureError(error, "excluir categoria")
		}
	},
})

export const categoryApi = CategoryAPI()