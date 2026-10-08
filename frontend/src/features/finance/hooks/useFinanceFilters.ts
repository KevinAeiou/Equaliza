import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { getPeriod, isApiError } from "@/src/lib/utils"
import { CategoryProps, FinanceEntryType, FinanceMemberProps, SelectOption } from "@/src/types"

import { toast } from "sonner"

import { FinanceService } from "../services/financial.service"
import { FormFinanceFilterSchema, FormFinanceFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"
import { PeriodType } from "../../dashboard/schemas/filters.schema"
import { isSameDay } from "date-fns"

interface UseFinanceFiltersProps {
	type: FinanceEntryType
	filters: FormFinanceFilterSchemaType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormFinanceFilterSchemaType) => void
}

// O período conta como filtro ativo quando difere do padrão (mês atual).
export const countFinanceFilters = (filters: FormFinanceFilterSchemaType) => {
	const defaults = getDefaultValues()

	const customPeriod =
		filters.type !== defaults.type ||
		!isSameDay(filters.period.from, defaults.period.from) ||
		!isSameDay(filters.period.to, defaults.period.to)

	return filters.categories.length + filters.members.length + Number(customPeriod)
}

export const useFinanceFilters = ({
	type,
	filters,
	showFilter,
	setShowFilter,
	onApply,
}: UseFinanceFiltersProps) => {
	const [categories, setCategories] = useState<CategoryProps[]>([])
	const [members, setMembers] = useState<FinanceMemberProps[]>([])

	const form = useForm<FormFinanceFilterSchemaType>({
		resolver: zodResolver(FormFinanceFilterSchema),
		defaultValues: filters,
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

	const memberOptions: SelectOption<number>[] = members.map(
		(member) => ({
			label: member.name,
			value: member.id,
		})
	)

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
		const loadMembers = async () => {
			try {
				setMembers(await FinanceService.listMembers())
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar membros"

				toast.error(message)
			}
		}

		loadMembers()
	}, [])

	// O painel sempre abre mostrando o filtro em uso, e não o que ficou marcado e não foi aplicado.
	useEffect(() => {
		if (showFilter) form.reset(filters)
	}, [form, filters, showFilter])

	useEffect(() => {
		if (periodType === PeriodType.PERIOD) return
		if (!form.getFieldState("type").isDirty) return

		form.setValue("period", getPeriod(periodType))
	}, [form, periodType])

	useEffect(() => {
		form.setValue("categories", [], {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		})
	}, [form, type])

	return {
		form,
		periodType,
		onSubmit,
		categoryOptions,
		memberOptions,
		handleClear,
	}
}