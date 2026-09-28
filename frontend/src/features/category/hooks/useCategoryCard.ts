import { isApiError } from "@/src/lib/utils"
import { CategoryProps, UserRole } from "@/src/types"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CategoryService } from "../services/category.service"
import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"
import { useAuth } from "@/src/components/providers/AuthProvider"


interface UseCategoryCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedCategory: (category: CategoryProps) => void
	filters: FormCategoryFilterSchemaType
}

export const useCategoryCard = ({
	refresh,
	setOpen,
	setSelectedCategory,
	filters,
}: UseCategoryCardProps) => {
	const [categories, setCategories] = useState<CategoryProps[]>([])
	const [loading, setLoading] = useState<boolean>(true)

	const { user } = useAuth()

	const currentFamilyId = user.current_family?.id

	// O backend só permite que responsáveis e administradores alterem categorias.
	const canManage = [UserRole.OWNER, UserRole.ADMIN].includes(user.role)

	const [reloadKey, setReloadKey] = useState<number>(0)

	const handleEditCategory = useCallback((category: CategoryProps) => {
		setSelectedCategory(category)
		setOpen(true)
	}, [setOpen, setSelectedCategory])

	const handleDeleteCategory = useCallback(async (category: CategoryProps) => {
		try {
			await CategoryService.delete(category.id)

			setReloadKey((key) => key + 1)

			toast.success(`Categoria excluída com sucesso.`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: `Erro ao excluir categoria.`

			toast.error(message)
		}
	}, [])

	// "loading" só indica a primeira carga; recargas mantêm a lista atual até chegar a nova.
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const response = await CategoryService.list(filters)

				setCategories(response)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar categorias"

				toast.error(message)
			} finally {
				setLoading(false)
			}
		}

		loadCategories()
	}, [filters, refresh, currentFamilyId, reloadKey])

	return {
		categories,
		loading,
		canManage,
		handleEditCategory,
		handleDeleteCategory,
	}
}
