import { DefaultValues } from "react-hook-form"
import { z } from "zod"
import { FINANCE_DESCRIPTION_MAX_LENGTH } from "../../finance/schemas/finance.schema"

export const FormRecurringSchema = z
	.object({
		type: z.enum(["EXPENSE", "INCOME"]),
		frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
		amount: z.coerce
			.number({ error: "Informe um valor." })
			.positive("O valor deve ser maior que zero.")
			.min(0.01, "Informe um valor maior que zero")
			.max(1_000_000, "O valor máximo permitido é R$ 1.000.000,00"),
		start_date: z.date({ error: "Informe a data de início." }),
		has_end: z.boolean(),
		end_date: z.date().optional(),
		description: z.string().max(FINANCE_DESCRIPTION_MAX_LENGTH).optional(),
		is_active: z.boolean(),
		category: z.preprocess(
			(value) => {
				if (value === "" || value === undefined || value === null) {
					return undefined
				}

				return Number(value)
			},
			z.number({ error: "Selecione uma categoria" })
		),
	})
	.superRefine((data, ctx) => {
		if (!data.has_end) return

		if (!data.end_date) {
			ctx.addIssue({
				code: "custom",
				path: ["end_date"],
				message: "Informe a data final.",
			})
			return
		}

		if (data.end_date < data.start_date) {
			ctx.addIssue({
				code: "custom",
				path: ["end_date"],
				message: "A data final não pode ser anterior à data de início.",
			})
		}
	})

export const getDefaultValues = (): DefaultValues<FormRecurringSchemaType> => ({
	type: "EXPENSE",
	frequency: "MONTHLY",
	amount: 0,
	start_date: new Date(),
	has_end: false,
	end_date: undefined,
	description: "",
	is_active: true,
	category: undefined,
})

export type FormRecurringSchemaType = z.infer<typeof FormRecurringSchema>
