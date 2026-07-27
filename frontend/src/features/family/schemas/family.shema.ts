import z from "zod"

export const FormFamilySchema = z.object({
	name: z
		.string()
		.min(3, "Informe o nome da família")
})

export const getDefaultValues = (): FormFamilySchemaType => ({
	name: "",
})

export type FormFamilySchemaType = z.infer<typeof FormFamilySchema>