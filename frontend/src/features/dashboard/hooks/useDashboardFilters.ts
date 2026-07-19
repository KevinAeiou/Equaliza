import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { getDefaultValues, FormDashboardFilterSchema, FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { CategoryProps, SelectOption } from "@/src/types"
import { FinanceService } from "../../finance/services/financial.service"
import { isApiError } from "@/src/lib/utils"
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

	const onSubmit = (values: FormDashboardFilterSchemaType) => {
		console.log(values)
		onApply(values)

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

	return {
		form,
		onSubmit,
		categoryOptions,
	}
}