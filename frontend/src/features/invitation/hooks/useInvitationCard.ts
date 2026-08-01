import { isApiError } from "@/src/lib/utils"
import { InviteProps } from "@/src/types"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { InvitationService } from "../services/invitation.service"
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { columns } from "../components/columns"
import { useAuth } from "@/src/components/providers/AuthProvider"

interface UseInvitarionCardProps {
	refresh: number
}

export const useInvitationCard = ({
	refresh,
}: UseInvitarionCardProps) => {
	const [invites, setInvites] = useState<InviteProps[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])

	const { user } = useAuth()

	const currentFamilyId = user.current_family?.id

	const loadInvitations = useCallback(async () => {
		setLoading(true)

		try {
			const response = await InvitationService.list()

			setInvites(response)
		} catch (error) {
			setInvites([])
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao listar convites"

			toast.error(message)
		} finally {
			setLoading(false)
		}
	}, [])

	const handleDeleteInvitation = async (invite: InviteProps) => {
		try {
			await InvitationService.delete(invite.id)

			setInvites((current) =>
				current.filter((item) => item.id !== invite.id)
			)

			toast.success("Convite excluído com sucesso.")
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao excluir convite."

			toast.error(message)
		}
	}

	useEffect(() => {
		loadInvitations()
	}, [loadInvitations, refresh, currentFamilyId])

	const table = useReactTable({
		data: invites,
		columns: columns(handleDeleteInvitation),
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return {
		loading,
		table,
	}
}