import { format } from "date-fns"
import { RecurringProps } from "@/src/types"
import { recurringApi } from "../infra/recurring"
import { FormRecurringSchemaType } from "../schemas/recurring.schema"

const toDate = (date: Date) => format(date, "yyyy-MM-dd")

const toEndDate = (data: FormRecurringSchemaType) =>
	data.has_end && data.end_date ? toDate(data.end_date) : null

export class RecurringService {

	static async list(): Promise<RecurringProps[]> {
		return await recurringApi.list()
	}

	static async retrieve(id: number): Promise<RecurringProps> {
		return await recurringApi.retrieve(id)
	}

	static async create(data: FormRecurringSchemaType): Promise<void> {
		await recurringApi.create({
			type: data.type,
			amount: data.amount,
			description: data.description,
			category: data.category,
			frequency: data.frequency,
			start_date: toDate(data.start_date),
			end_date: toEndDate(data),
		})
	}

	// A API só altera valor, categoria, observação, data final e situação.
	static async update(id: number, data: FormRecurringSchemaType): Promise<void> {
		await recurringApi.update(id, {
			amount: data.amount,
			description: data.description,
			category: data.category,
			end_date: toEndDate(data),
			is_active: data.is_active,
		})
	}

	static async setActive(recurring: RecurringProps, isActive: boolean): Promise<void> {
		await recurringApi.update(recurring.id, {
			amount: recurring.amount,
			description: recurring.description,
			category: recurring.category.id,
			end_date: recurring.end_date,
			is_active: isActive,
		})
	}

	static async delete(id: number): Promise<void> {
		await recurringApi.delete(id)
	}
}
