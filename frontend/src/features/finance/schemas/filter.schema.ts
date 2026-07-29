import { endOfMonth, startOfMonth } from "date-fns"
import { z } from "zod"
import { PeriodType } from "../../dashboard/schemas/filters.schema"

export const FormFinanceFilterSchema = z.object({
	type: z.enum(PeriodType),

	period: z.object({
		from: z.date(),
		to: z.date(),
	}),

	categories: z.array(z.number()),
})

export type FormFinanceFilterSchemaType = z.infer<
	typeof FormFinanceFilterSchema
>

export const getDefaultValues = (): FormFinanceFilterSchemaType => ({
	type: PeriodType.MONTH,

	period: {
		from: startOfMonth(new Date()),
		to: endOfMonth(new Date()),
	},

	categories: [],
})