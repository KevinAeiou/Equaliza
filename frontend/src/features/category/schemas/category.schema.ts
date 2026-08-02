import z from "zod"

export const FormCategorySchema = z.object({
	name: z
		.string()
		.min(3, "Informe o nome da categoria"),

	type: z.enum(["EXPENSE", "INCOME"], {
		message: "Selecione o tipo da categoria",
	}),
})

export const getDefaultValues = (): FormCategorySchemaType => ({
	name: "",
	type: "EXPENSE",
})

export type FormCategorySchemaType = z.infer<typeof FormCategorySchema>