import z from "zod"

export const FormForgotPasswordSchema = z.object({
	email: z
		.email("Por favor, insira um e-mail válido."),
})

export const FormResetPasswordSchema = z.object({
	password: z
		.string()
		.min(8, "A senha deve possuir no mínimo 8 caracteres"),

	passwordConfirmation: z
		.string(),
}).refine(
	(data) => data.password === data.passwordConfirmation,
	{
		message: "As senhas não coincidem",
		path: ["passwordConfirmation"],
	}
)

export type FormForgotPasswordSchemaType = z.infer<typeof FormForgotPasswordSchema>
export type FormResetPasswordSchemaType = z.infer<typeof FormResetPasswordSchema>
