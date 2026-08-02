import { useForm } from "react-hook-form"
import { FormCategoryFilterSchema, FormCategoryFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { SelectOption } from "@/src/types"

interface UseCategoryFiltersProps {
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormCategoryFilterSchemaType) => void
}

export const useCategoryFilters = ({
	setShowFilter,
	onApply,
}: UseCategoryFiltersProps) => {
	const form = useForm<FormCategoryFilterSchemaType>({
		resolver: zodResolver(FormCategoryFilterSchema),
		defaultValues: getDefaultValues(),
	})

	const typeOptions: SelectOption<string>[] = [
		{
			label: "Todos",
			value: "",
		},
		{
			label: "Receitas",
			value: "INCOME",
		},
		{
			label: "Despesas",
			value: "EXPENSE",
		},
	]

	const onSubmit = (values: FormCategoryFilterSchemaType) => {
		onApply(values)
		setShowFilter(false)
	}

	const handleClear = () => {
		const defaults = getDefaultValues()

		form.reset(defaults)
		onApply(defaults)

		setShowFilter(false)
	}

	return {
		form,
		typeOptions,
		onSubmit,
		handleClear,
	}
}