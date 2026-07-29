import { DefaultValues } from "react-hook-form"
import z from "zod"

export const FormInvitationSchema = z.object({
	email: z
		.email("Informe um e-mail válido"),
})

export const getDefaultValues = (): DefaultValues<FormInvitationSchemaType> => ({
	email: "",
})

export type FormInvitationSchemaType = z.infer<typeof FormInvitationSchema>