import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/src/components/providers/AuthProvider"
import { isApiError } from "@/src/lib/utils"
import { RecurringProps } from "@/src/types"
import { RecurringService } from "../services/recurring.service"

export const useRecurringScreen = () => {
	const [items, setItems] = useState<RecurringProps[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [reloadKey, setReloadKey] = useState<number>(0)
	const [open, setOpen] = useState<boolean>(false)
	const [recurringId, setRecurringId] = useState<number | undefined>(undefined)
	const [toDelete, setToDelete] = useState<RecurringProps | undefined>(undefined)

	const { user } = useAuth()
	const currentFamilyId = user.current_family?.id

	useEffect(() => {
		const load = async () => {
			try {
				setItems(await RecurringService.list())
			} catch (error) {
				toast.error(
					isApiError(error)
						? error.message
						: "Erro desconhecido ao listar recorrentes"
				)
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [reloadKey, currentFamilyId])

	const onCreate = () => {
		setRecurringId(undefined)
		setOpen(true)
	}

	const onEdit = (item: RecurringProps) => {
		setRecurringId(item.id)
		setOpen(true)
	}

	const onToggle = async (item: RecurringProps, isActive: boolean) => {
		// Atualiza a tela na hora e desfaz se a API recusar.
		setItems((current) =>
			current.map((entry) =>
				entry.id === item.id ? { ...entry, is_active: isActive } : entry
			)
		)

		try {
			await RecurringService.setActive(item, isActive)

			toast.success(isActive ? "Recorrente ativada." : "Recorrente pausada.")
		} catch (error) {
			setItems((current) =>
				current.map((entry) =>
					entry.id === item.id ? { ...entry, is_active: !isActive } : entry
				)
			)

			toast.error(isApiError(error) ? error.message : "Erro ao atualizar recorrente.")
		}
	}

	const onConfirmDelete = async () => {
		if (!toDelete) return

		try {
			await RecurringService.delete(toDelete.id)

			setItems((current) => current.filter((entry) => entry.id !== toDelete.id))

			toast.success("Recorrente excluída com sucesso.")
		} catch (error) {
			toast.error(isApiError(error) ? error.message : "Erro ao excluir recorrente.")
		} finally {
			setToDelete(undefined)
		}
	}

	const activeCount = items.filter((item) => item.is_active).length

	return {
		items,
		loading,
		userId: user.id,
		activeCount,
		pausedCount: items.length - activeCount,
		open, setOpen,
		recurringId, setRecurringId,
		toDelete, setToDelete,
		onCreate,
		onEdit,
		onToggle,
		onConfirmDelete,
		reload: () => setReloadKey((value) => value + 1),
	}
}
