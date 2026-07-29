import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { getDefaultValues, FormDashboardFilterSchema, FormDashboardFilterSchemaType, PeriodType } from "../schemas/filters.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { CategoryProps, SelectOption } from "@/src/types"
import { FinanceService } from "../../finance/services/financial.service"
import { getPeriod, isApiError } from "@/src/lib/utils"
import { toast } from "sonner"

interface UseDashboardFiltersProps {
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormDashboardFilterSchemaType) => void
}

export const useDashboardFilters = ({
	setShowFilter,
	onApply,
}: UseDashboardFiltersProps) => {
	const [categories, setCategories] = useState<CategoryProps[]>([])

	const form = useForm<FormDashboardFilterSchemaType>({
		resolver: zodResolver(FormDashboardFilterSchema),
		defaultValues: getDefaultValues(),
	})

	const categoryOptions: SelectOption<number>[] = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}))

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

	useEffect(() => {
		const loadCategories = async () => {
			setCategories([])

			try {
				const response = await FinanceService.listCategories()

				setCategories(response)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar categorias"

				toast.error(message)
			}
		}

		loadCategories()
	}, [])

	useEffect(() => {
		if (type === PeriodType.PERIOD) return

		form.setValue("period", getPeriod(type))
	}, [form, type])

	return {
		form,
		type,
		onSubmit,
		categoryOptions,
		handleClear,
		periodOptions,
	}
}