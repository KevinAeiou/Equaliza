import { isApiError } from "@/src/lib/utils"
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { FamilyService } from "../services/family.service"
import { columns } from "../components/columns"
import { FamilyProps } from "@/src/types"
import { useAuth } from "../../../components/providers/AuthProvider"

interface UseFamilyCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedFamily: (family: FamilyProps) => void
}

export const useFamilyCard = ({
	refresh,
	setOpen,
	setSelectedFamily,
}: UseFamilyCardProps) => {
	const [families, setFamilies] = useState<FamilyProps[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])

	const {
		user,
		refreshUser,
	} = useAuth()

	const currentFamilyId = user.current_family?.id

	const handleEditFamily = useCallback(async (family: FamilyProps) => {
		setSelectedFamily(family)
		setOpen(true)
	}, [setOpen, setSelectedFamily])

	const loadFamilies = useCallback(async () => {
		setLoading(true)

		try {
			const response = await FamilyService.list()

			setFamilies(response)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao listar famílias"

			toast.error(message)
		} finally {
			setLoading(false)
		}
	}, [])

	const handleDeleteFamily = useCallback(async (family: FamilyProps) => {
		try {
			await FamilyService.delete(family.id)

			await loadFamilies()

			await refreshUser()

			toast.success(`Família excluída com sucesso.`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: `Erro ao excluir família.`

			toast.error(message)
		}
	}, [loadFamilies, refreshUser])

	const tableColumns = useMemo(() => columns(handleEditFamily, handleDeleteFamily),
		[handleDeleteFamily, handleEditFamily]
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
		loadFamilies()
	}, [loadFamilies, refresh, currentFamilyId])

	return {
		table,
		loading,
	}
}