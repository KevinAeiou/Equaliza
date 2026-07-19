import { CategoryProps, FinanceEntryType } from "@/src/types"
import { FinanceAPI, FinanceResponse } from "../infra/finance"
import { FormFinanceSchemaType } from "../schemas/finance.schema"
import { format } from "date-fns"

const financeApi = FinanceAPI()


export class FinanceService {

	static async retrieve<T extends FinanceEntryType>(
		type: T,
		id: number,
	): Promise<FinanceResponse<T>> {
		return await financeApi.retrieve(type, id)
	}

	static async list<T extends FinanceEntryType>(
		type: T
	): Promise<FinanceResponse<T>[]> {
		return await financeApi.list(type)
	}


	static async listCategories(): Promise<CategoryProps[]> {
		return await financeApi.listCategories()
	}


	static async create(
		type: FinanceEntryType,
		data: FormFinanceSchemaType,
	): Promise<void> {

		const payload = {
			...data,
			date: data.date
				? format(data.date, "yyyy-MM-dd")
				: undefined,
		}

		await financeApi.create(type, payload)
	}


	static async update(
		type: FinanceEntryType,
		id: number,
		data: FormFinanceSchemaType,
	): Promise<void> {

		const payload = {
			...data,
			date: data.date
				? format(data.date, "yyyy-MM-dd")
				: undefined,
		}

		await financeApi.update(type, id, payload)
	}


	static async delete(
		type: FinanceEntryType,
		id: number,
	): Promise<void> {
		await financeApi.delete(type, id)
	}
}