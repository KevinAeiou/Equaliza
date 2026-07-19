import z from "zod"

export const FormInvitationSchema = z.object({
	email: z
		.email("Informe um e-mail válido"),
})

export const getDefaultValues = (): FormInvitationSchemaType => ({
	email: "",
})

export type FormInvitationSchemaType = z.infer<typeof FormInvitationSchema>