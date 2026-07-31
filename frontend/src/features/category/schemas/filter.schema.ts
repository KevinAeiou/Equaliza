import { z } from "zod"

export const FormCategoryFilterSchema = z.object({
	name: z.string(),

	type: z
		.enum(["EXPENSE", "INCOME"])
		.or(z.literal("")),
})

export type FormCategoryFilterSchemaType = z.infer<typeof FormCategoryFilterSchema>

export const getDefaultValues = (): FormCategoryFilterSchemaType => ({
	name: "",
	type: "",
})