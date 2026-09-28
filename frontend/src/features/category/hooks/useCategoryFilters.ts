import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { FormCategoryFilterSchema, FormCategoryFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { SelectOption } from "@/src/types"

interface UseCategoryFiltersProps {
	filters: FormCategoryFilterSchemaType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormCategoryFilterSchemaType) => void
}

export const countCategoryFilters = (filters: FormCategoryFilterSchemaType) =>
	Number(Boolean(filters.name.trim())) + Number(Boolean(filters.type))

export const useCategoryFilters = ({
	filters,
	showFilter,
	setShowFilter,
	onApply,
}: UseCategoryFiltersProps) => {
	const form = useForm<FormCategoryFilterSchemaType>({
		resolver: zodResolver(FormCategoryFilterSchema),
		defaultValues: filters,
	})

	const typeOptions: SelectOption<string>[] = [
		{
			label: "Todos",
			value: "",
		},
		{
			label: "Despesas",
			value: "EXPENSE",
		},
		{
			label: "Receitas",
			value: "INCOME",
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

	// O painel sempre abre mostrando o filtro em uso, e não o que ficou digitado e não foi aplicado.
	useEffect(() => {
		if (showFilter) form.reset(filters)
	}, [form, filters, showFilter])

	return {
		form,
		typeOptions,
		onSubmit,
		handleClear,
	}
}
