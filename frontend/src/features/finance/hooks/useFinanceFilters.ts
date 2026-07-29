import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { getPeriod, isApiError } from "@/src/lib/utils"
import { CategoryProps, FinanceEntryType, SelectOption } from "@/src/types"

import { toast } from "sonner"

import { FinanceService } from "../services/financial.service"
import { FormFinanceFilterSchema, FormFinanceFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"
import { PeriodType } from "../../dashboard/schemas/filters.schema"

interface UseFinanceFiltersProps {
	type: FinanceEntryType
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormFinanceFilterSchemaType) => void
}

export const useFinanceFilters = ({
	type,
	setShowFilter,
	onApply,
}: UseFinanceFiltersProps) => {
	const [categories, setCategories] = useState<CategoryProps[]>([])

	const form = useForm<FormFinanceFilterSchemaType>({
		resolver: zodResolver(FormFinanceFilterSchema),
		defaultValues: getDefaultValues(),
	})

	const periodType = useWatch({
		control: form.control,
		name: "type",
	})

	const categoryOptions: SelectOption<number>[] = categories.map(
		(category) => ({
			label: category.name,
			value: category.id,
		})
	)

	const periodOptions: SelectOption<string>[] = [
		{
			label: "Dia",
			value: PeriodType.DAY,
		},
		{
			label: "Semana",
			value: PeriodType.WEEK,
		},
		{
			label: "Mês",
			value: PeriodType.MONTH,
		},
		{
			label: "Ano",
			value: PeriodType.YEAR,
		},
		{
			label: "Período personalizado",
			value: PeriodType.PERIOD,
		},
	]

	const onSubmit = (values: FormFinanceFilterSchemaType) => {
		onApply(values)
		setShowFilter(false)
	}

	const handleClear = () => {
		const defaults = getDefaultValues()

		form.reset(defaults)
		onApply(defaults)

		setShowFilter(false)
	}

	useEffect(() => {
		const loadCategories = async () => {
			setCategories([])

			try {
				const response = await FinanceService.listCategories()

				setCategories(
					response.filter((category) => category.type === type)
				)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar categorias"

				toast.error(message)
			}
		}

		loadCategories()
	}, [type])

	useEffect(() => {
		if (periodType === PeriodType.PERIOD) return

		form.setValue("period", getPeriod(periodType))
	}, [form, periodType])

	useEffect(() => {
		form.reset(getDefaultValues())
	}, [type])

	return {
		form,
		periodType,
		onSubmit,
		categoryOptions,
		periodOptions,
		handleClear,
	}
}