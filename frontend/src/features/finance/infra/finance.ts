import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import {
	CategoryProps,
	ExpenseProps,
	FinanceEntryType,
	FinancialPayload,
	IncomeProps,
} from "@/src/types"


export type FinanceResponse<T extends FinanceEntryType> =
	T extends "EXPENSE"
	? ExpenseProps
	: IncomeProps


const getEndpoint = (type: FinanceEntryType) =>
	type === "EXPENSE"
		? "expenses/"
		: "income/"


export const FinanceAPI = () => ({

	retrieve: async <T extends FinanceEntryType>(
		type: T,
		id: number,
	): Promise<FinanceResponse<T>> => {
		try {
			const response = await api<FinanceResponse<T>>({
				url: `finances/${getEndpoint(type)}${id}/`,
				method: "GET",
			})

			return response.data
		} catch (error) {
			throw configureError(error, "buscar finança")
		}
	},

	list: async <T extends FinanceEntryType>(
		type: T
	): Promise<FinanceResponse<T>[]> => {
		const response = await api<FinanceResponse<T>[]>({
			url: `finances/${getEndpoint(type)}`,
			method: "GET",
		})

		return response.data
	},

	listCategories: async (): Promise<CategoryProps[]> => {
		const response = await api<CategoryProps[]>({
			url: "finances/categories/",
			method: "GET",
		})

		return response.data
	},

	create: async (
		type: FinanceEntryType,
		data: FinancialPayload,
	): Promise<void> => {
		try {
			await api({
				url: `finances/${getEndpoint(type)}`,
				method: "POST",
				data,
			})
		} catch (error) {
			throw configureError(error, "criar finança")
		}
	},

	update: async (
		type: FinanceEntryType,
		id: number,
		data: FinancialPayload,
	): Promise<void> => {
		try {
			await api({
				url: `finances/${getEndpoint(type)}${id}/`,
				method: "PUT",
				data,
			})
		} catch (error) {
			throw configureError(error, "atualizar finança")
		}
	},

	delete: async (
		type: FinanceEntryType,
		id: number,
	): Promise<void> => {
		try {
			await api({
				url: `finances/${getEndpoint(type)}${id}/`,
				method: "DELETE",
			})
		} catch (error) {
			throw configureError(error, "excluir finança")
		}
	},
})