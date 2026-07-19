import { isApiError } from "@/src/lib/utils"
import { InviteProps } from "@/src/types"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { InvitationService } from "../services/invitation.service"
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { columns } from "../components/columns"


export const useInvitationCard = () => {
	const [invites, setInvites] = useState<InviteProps[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])

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
		const loadInvitations = async () => {
			setLoading(true)

			try {
				const response = await InvitationService.list()
				setInvites(response)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar convites"

				toast.error(message)
			} finally {
				setLoading(false)
			}
		}

		loadInvitations()
	}, [])

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