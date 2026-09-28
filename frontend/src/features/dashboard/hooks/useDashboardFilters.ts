import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { getDefaultValues, FormDashboardFilterSchema, FormDashboardFilterSchemaType, PeriodType } from "../schemas/filters.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { getPeriod } from "@/src/lib/utils"

interface UseDashboardFiltersProps {
	filters: FormDashboardFilterSchemaType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormDashboardFilterSchemaType) => void
}

export const useDashboardFilters = ({
	filters,
	showFilter,
	setShowFilter,
	onApply,
}: UseDashboardFiltersProps) => {
	const form = useForm<FormDashboardFilterSchemaType>({
		resolver: zodResolver(FormDashboardFilterSchema),
		defaultValues: filters,
	})

	const type = useWatch({
		control: form.control,
		name: "type",
	})

	const onSubmit = (values: FormDashboardFilterSchemaType) => {
		onApply(values)

		setShowFilter(false)
	}

	const handleClear = () => {
		form.reset(getDefaultValues())

		onApply(getDefaultValues())

		setShowFilter(false)
	}

	// O período também muda fora do painel (setas e etiquetas), então o formulário parte do filtro atual.
	useEffect(() => {
		if (showFilter) form.reset(filters)
	}, [form, filters, showFilter])

	useEffect(() => {
		if (type === PeriodType.PERIOD) return
		if (!form.getFieldState("type").isDirty) return

		form.setValue("period", getPeriod(type))
	}, [form, type])

	return {
		form,
		type,
		onSubmit,
		handleClear,
	}
}