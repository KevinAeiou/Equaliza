import { isApiError } from "@/src/lib/utils"
import { CategoryProps } from "@/src/types"
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { columns } from "../components/Columns"
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
	const [families, setFamilies] = useState<CategoryProps[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])

	const { user } = useAuth()

	const currentFamilyId = user.current_family?.id

	const loadCategories = useCallback(async () => {
		setLoading(true)

		try {
			const response = await CategoryService.list(filters)

			setFamilies(response)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao listar categorias"

			toast.error(message)
		} finally {
			setLoading(false)
		}
	}, [filters])

	const handleEditCategory = useCallback(async (family: CategoryProps) => {
		setSelectedCategory(family)
		setOpen(true)
	}, [setOpen, setSelectedCategory])

	const handleDeleteCategory = useCallback(async (family: CategoryProps) => {
		try {
			await CategoryService.delete(family.id)

			await loadCategories()

			toast.success(`Categoria excluída com sucesso.`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: `Erro ao excluir categoria.`

			toast.error(message)
		}
	}, [loadCategories])

	const tableColumns = useMemo(() => columns(handleEditCategory, handleDeleteCategory),
		[handleDeleteCategory, handleEditCategory]
	)

	const table = useReactTable({
		data: families,
		columns: tableColumns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	useEffect(() => {
		loadCategories()
	}, [loadCategories, refresh, currentFamilyId])

	return {
		table,
		loading,
	}
}