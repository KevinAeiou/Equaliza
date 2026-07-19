import z from "zod"

export const FormRegisterSchema = z.object({

	first_name: z
		.string()
		.min(3, "Informe seu primeiro nome"),

	last_name: z
		.string()
		.min(3, "Informe seu sobrenome"),

	family_name: z
		.string()
		.min(3, "Informe o nome da família")
		.optional()
		.or(z.literal("")),

	email: z
		.email("Informe um e-mail válido"),


	password: z
		.string()
		.min(8, "A senha deve possuir no mínimo 8 caracteres"),


	passwordConfirmation: z
		.string(),

	token: z
		.string()
		.optional()
		.or(z.literal(null)),

}).refine(
	(data) => data.password === data.passwordConfirmation,
	{
		message: "As senhas não coincidem",
		path: ["passwordConfirmation"],
	}
)