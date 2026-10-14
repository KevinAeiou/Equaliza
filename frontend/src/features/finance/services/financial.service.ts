import { CategoryProps, FinanceEntryType, FinanceMemberProps, FinanceParams } from "@/src/types"
import { ExportFormat, financeApi, FinanceResponse } from "../infra/finance"
import { FormFinanceSchemaType } from "../schemas/finance.schema"
import { format } from "date-fns"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"

export class FinanceService {

	static async retrieve<T extends FinanceEntryType>(
		type: T,
		id: number,
	): Promise<FinanceResponse<T>> {
		return await financeApi.retrieve(type, id)
	}

	static toParams(
		filters: Omit<FormFinanceFilterSchemaType, "members"> & { members?: number[] }
	): FinanceParams {
		return {
			from_date: filters.period.from
				? format(filters.period.from, "yyyy-MM-dd")
				: undefined,

			to_date: filters.period.to
				? format(filters.period.to, "yyyy-MM-dd")
				: undefined,

			categories: filters.categories.length
				? filters.categories
				: undefined,

			members: filters.members?.length
				? filters.members
				: undefined,
		}
	}

	static async export(
		type: FinanceEntryType,
		filters: Omit<FormFinanceFilterSchemaType, "members"> & { members?: number[] },
		exportFormat: ExportFormat,
	): Promise<void> {
		const blob = await financeApi.export(type, this.toParams(filters), exportFormat)
		const name = type === "EXPENSE" ? "despesas" : "receitas"
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")

		link.href = url
		link.download = `${name}-${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`
		document.body.appendChild(link)
		link.click()
		link.remove()
		URL.revokeObjectURL(url)
	}

	static async list<T extends FinanceEntryType>(
		type: T,
		filters: Omit<FormFinanceFilterSchemaType, "members"> & { members?: number[] }
	): Promise<FinanceResponse<T>[]> {
		const params = this.toParams(filters)

		return await financeApi.list(type, params)
	}

	static async listCategories(): Promise<CategoryProps[]> {
		return await financeApi.listCategories()
	}

	static async listMembers(): Promise<FinanceMemberProps[]> {
		return await financeApi.listMembers()
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