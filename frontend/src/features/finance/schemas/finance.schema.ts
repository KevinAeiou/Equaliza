import { DefaultValues } from "react-hook-form"
import { z } from "zod"

export const FINANCE_DESCRIPTION_MAX_LENGTH = 1000

export const FormFinanceSchema = z.object({
	amount: z.coerce
		.number({
			error: "Informe um valor."
		})
		.positive("O valor deve ser maior que zero.")
		.min(0.01, "Informe um valor maior que zero")
		.max(1_000_000, "O valor máximo permitido é R$ 1.000.000.000,00"),
	date: z.date().optional(),
	description: z.string().max(FINANCE_DESCRIPTION_MAX_LENGTH).optional(),
	category: z.preprocess(
		(value) => {
			if (value === "" || value === undefined || value === null) {
				return undefined
			}

			return Number(value)
		},
		z.number({
			error: "Selecione uma categoria",
		})
	)
})

export const getDefaultValues = (): DefaultValues<FormFinanceSchemaType> => ({
	amount: 0,
	date: new Date(),
	description: "",
	category: undefined,
})

export type FormFinanceSchemaType = z.infer<typeof FormFinanceSchema>