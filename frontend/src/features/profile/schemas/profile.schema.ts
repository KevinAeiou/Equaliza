import { AVATARS } from "@/src/constants/avatars"
import z from "zod"

const avatarIds = AVATARS.map((avatar) => avatar.id) as [
	string,
	...string[],
]

export const ProfileFormSchema = z.object({
	first_name: z
		.string()
		.trim()
		.min(2, "O nome deve possuir pelo menos 2 caracteres")
		.max(150, "O nome deve possuir no máximo 150 caracteres"),
	
	last_name: z
		.string()
		.trim()
		.min(3, "Informe seu sobrenome"),
	
	avatar: z.enum(avatarIds, {
		message: "Selecione um avatar válido",
	}),
})

export const getDefaultValues = (): ProfileFormSchemaType => ({
	first_name: ``,
	last_name: ``,
	avatar: AVATARS[0].id,
})

export type ProfileFormSchemaType = z.infer<typeof ProfileFormSchema>