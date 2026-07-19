import { z } from "zod"

export const FINANCE_DESCRIPTION_MAX_LENGTH = 1000

export const FormFinanceSchema = z.object({
	amount: z.coerce
		.number()
		.min(0.01, "Informe um valor maior que zero"),
	date: z.date().optional(),
	description: z.string().max(FINANCE_DESCRIPTION_MAX_LENGTH).optional(),
	category: z
		.number()
		.optional()
		.refine((value) => value !== undefined, {
			message: "Selecione uma categoria",
		}),
})

export const defaultValues = (): FormFinanceSchemaType => ({
	amount: 0,
	date: new Date(),
	description: "",
	category: undefined,
})

export type FormFinanceSchemaType = z.infer<typeof FormFinanceSchema>