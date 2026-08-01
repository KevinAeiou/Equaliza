import {
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table"
import { columns } from "../components/FinanceColumns"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { isApiError } from "@/src/lib/utils"
import { FinanceService } from "../services/financial.service"
import { ExpenseProps, IncomeProps } from "@/src/types"
import { FinanceCardProps } from "../components/FinanceCard"
import { useAuth } from "@/src/components/providers/AuthProvider"

export type Finance = ExpenseProps | IncomeProps

export const useFinanceCard = ({
	type,
	setOpen,
	setFinanceId,
	refresh,
	filters,
}: FinanceCardProps) => {
	const [finances, setFinances] = useState<Finance[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])

	const { user } = useAuth()

	const currentFamilyId = user.current_family?.id

	const loadFinances = useCallback(async () => {
		setLoading(true)

		try {
			const response = await FinanceService.list(type, filters)

			setFinances(response)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao listar finanças"

			toast.error(message)
		} finally {
			setLoading(false)
		}
	}, [type, filters])

	const handleDelete = useCallback(async (finance: Finance) => {
		try {
			await FinanceService.delete(type, finance.id)

			setFinances((current) =>
				current.filter((item) => item.id !== finance.id)
			)

			toast.success("Finança excluída com sucesso.")
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao excluir finança."

			toast.error(message)
		}
	}, [type])

	const onEdit = useCallback((finance: Finance) => {
		setFinanceId(finance.id)
		setOpen(true)
	}, [setFinanceId, setOpen])

	const tableColumns = useMemo(() => columns(handleDelete, onEdit, type),
		[handleDelete, onEdit, type]
	)

	const table = useReactTable({
		data: finances,
		columns: tableColumns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	useEffect(() => {
		loadFinances()
	}, [loadFinances, refresh, currentFamilyId])

	return {
		table,
		loading,
	}
}