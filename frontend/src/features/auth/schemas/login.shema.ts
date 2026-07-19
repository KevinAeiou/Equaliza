import z from "zod"

export const FormLoginSchema = z.object({
	email: z
		.email("Por favor, insira um e-mail válido.")
		.min(1, "O e-mail é obrigatório."),
	password: z
		.string("Campo requerido!")
		.min(1, "A senha é obrigatória."),
})