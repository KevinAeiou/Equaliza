import { DefaultValues } from "react-hook-form"
import { z } from "zod"

export const SETTLEMENT_NOTE_MAX_LENGTH = 255

export const FormPaymentSchema = z.object({
	receiver: z.preprocess(
		(value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
		z.number({ error: "Selecione quem vai receber" }),
	),
	amount: z.coerce
		.number({ error: "Informe um valor." })
		.min(0.01, "O valor deve ser maior que zero."),
	paid_at: z.date().optional(),
	note: z.string().max(SETTLEMENT_NOTE_MAX_LENGTH).optional(),
})

export const getDefaultValues = (): DefaultValues<FormPaymentSchemaType> => ({
	receiver: undefined,
	amount: 0,
	paid_at: new Date(),
	note: "",
})

export type FormPaymentSchemaType = z.infer<typeof FormPaymentSchema>
