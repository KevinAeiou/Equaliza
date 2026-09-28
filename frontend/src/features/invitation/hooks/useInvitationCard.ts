import { isApiError } from "@/src/lib/utils"
import { InviteProps } from "@/src/types"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { InvitationService } from "../services/invitation.service"
import { useAuth } from "@/src/components/providers/AuthProvider"

interface UseInvitarionCardProps {
	refresh: number
}

export const useInvitationCard = ({
	refresh,
}: UseInvitarionCardProps) => {
	const [invites, setInvites] = useState<InviteProps[]>([])
	const [loading, setLoading] = useState<boolean>(true)

	const { user } = useAuth()

	const currentFamilyId = user.current_family?.id

	const handleDeleteInvitation = async (invite: InviteProps) => {
		try {
			await InvitationService.delete(invite.id)

			setInvites((current) =>
				current.filter((item) => item.id !== invite.id)
			)

			toast.success(invite.status === "Pendente" ? "Convite cancelado." : "Convite excluído.")
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao excluir convite."

			toast.error(message)
		}
	}

	useEffect(() => {
		const loadInvitations = async () => {
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
		}

		loadInvitations()
	}, [refresh, currentFamilyId])

	return {
		loading,
		invites,
		handleDeleteInvitation,
	}
}
