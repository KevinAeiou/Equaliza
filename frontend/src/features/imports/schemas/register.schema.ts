import { z } from "zod"
import { FINANCE_DESCRIPTION_MAX_LENGTH } from "../../finance/schemas/finance.schema"

const requiredId = (message: string) =>
	z.preprocess(
		(value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
		z.number({ error: message })
	)

const target = {
	family: requiredId("Selecione uma família"),
	category: requiredId("Selecione uma categoria"),
}

// Registrar uma pendência: valor, data e descrição saem pré-preenchidos e podem ser ajustados.
export const RegisterPendingSchema = z.object({
	...target,
	amount: z.coerce
		.number({ error: "Informe um valor." })
		.positive("O valor deve ser maior que zero.")
		.max(1_000_000, "O valor máximo permitido é R$ 1.000.000,00"),
	date: z.date({ error: "Informe a data." }),
	description: z.string().max(FINANCE_DESCRIPTION_MAX_LENGTH).optional(),
})

// Em lote só se escolhe família e categoria; cada linha mantém os próprios dados.
export const BulkRegisterSchema = z.object(target)

export type RegisterPendingFormType = z.infer<typeof RegisterPendingSchema>
