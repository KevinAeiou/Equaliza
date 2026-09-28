import { isApiError } from "@/src/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { FamilyService } from "../services/family.service"
import { FamilyOverviewProps, FamilyProps } from "@/src/types"
import { AuthService } from "@/src/features/auth/services/auth.service"
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
	const [families, setFamilies] = useState<FamilyOverviewProps[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [reloadKey, setReloadKey] = useState<number>(0)
	const [familyToDelete, setFamilyToDelete] = useState<FamilyOverviewProps | null>(null)

	const {
		user,
		refreshUser,
	} = useAuth()

	const currentFamilyId = user.current_family?.id

	const handleEditFamily = useCallback((family: FamilyProps) => {
		setSelectedFamily(family)
		setOpen(true)
	}, [setOpen, setSelectedFamily])

	const handleConfirmDelete = async () => {
		if (!familyToDelete) return

		try {
			await FamilyService.delete(familyToDelete.id)

			setFamilyToDelete(null)
			setReloadKey((key) => key + 1)

			await refreshUser()

			toast.success(`Família excluída com sucesso.`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: `Erro ao excluir família.`

			toast.error(message)
		}
	}

	const handleUseFamily = async (family: FamilyOverviewProps) => {
		try {
			await AuthService.changeCurrentFamily(family.id)

			await refreshUser()

			toast.success(`Agora você está em ${family.name}.`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao trocar de família."

			toast.error(message)
		}
	}

	useEffect(() => {
		const loadFamilies = async () => {
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
		}

		loadFamilies()
	}, [refresh, currentFamilyId, reloadKey])

	return {
		families,
		loading,
		currentFamilyId,
		familyToDelete,
		setFamilyToDelete,
		handleEditFamily,
		handleConfirmDelete,
		handleUseFamily,
	}
}
