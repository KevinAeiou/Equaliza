import { endOfMonth, startOfMonth } from "date-fns"
import z from "zod"

export const FormDashboardFilterSchema = z.object({
	period: z.object({
		from: z.date(),
		to: z.date(),
	}),

	categories: z
		.array(
			z.number()
		),
})

export const getDefaultValues = (): FormDashboardFilterSchemaType => ({
	period: {
		from: startOfMonth(new Date()),
		to: endOfMonth(new Date()),
	},
	categories: []
})

export type FormDashboardFilterSchemaType = z.infer<typeof FormDashboardFilterSchema>