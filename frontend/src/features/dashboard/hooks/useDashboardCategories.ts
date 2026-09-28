import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChipGroup } from "@/src/components/filters"
import { CategoryProps, SelectOption } from "@/src/types"
import { isApiError } from "@/src/lib/utils"
import { FinanceService } from "../../finance/services/financial.service"

export const useDashboardCategories = () => {
	const [categories, setCategories] = useState<CategoryProps[]>([])

	const categoryOptions: SelectOption<number>[] = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}))

	const categoryGroups: ChipGroup[] = [
		{ label: "Despesas", type: "EXPENSE" },
		{ label: "Receitas", type: "INCOME" },
	].map((group) => ({
		label: group.label,
		options: categories
			.filter((category) => category.type === group.type)
			.map((category) => ({ label: category.name, value: category.id })),
	}))

	useEffect(() => {
		const loadCategories = async () => {
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
		categoryOptions,
		categoryGroups,
	}
}
