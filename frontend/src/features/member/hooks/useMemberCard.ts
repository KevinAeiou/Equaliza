import { isApiError } from "@/src/lib/utils"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MemberService } from "../services/member.service"
import { MemberProps } from "@/src/types"


export const useMemberCard = () => {
	const [members, setMembers] = useState<MemberProps[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [open, setOpen] = useState(false)
	const [selectedMember, setSelectedMember] = useState<MemberProps | null>(null)

	const handleOnDelete = async () => {
		if (!selectedMember) return

		try {
			await MemberService.delete(selectedMember.id)

			setMembers((current) =>
				current.filter((item) => item.id !== selectedMember.id)
			)

			toast.success("Membro removido da família.")

			handleOnClose()
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao remover membro."

			toast.error(message)
		}
	}

	const handleToggleStatus = async (member: MemberProps) => {
		try {
			await MemberService.toggleStatus(member.id)

			setMembers((current) =>
				current.map((item) =>
					item.id === member.id
						? { ...item, is_active: !item.is_active }
						: item
				)
			)

			toast.success(member.is_active ? "Membro desativado." : "Membro reativado.")
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao alterar o status do membro"

			toast.error(message)
		}
	}

	const handleOpenDelete = (member: MemberProps) => {
		setSelectedMember(member)
		setOpen(true)
	}

	const handleOnClose = () => {
		setOpen(false)
		setSelectedMember(null)
	}

	useEffect(() => {
		const loadMembers = async () => {
			try {
				const response = await MemberService.list()

				setMembers(response)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar membros"

				toast.error(message)
			} finally {
				setLoading(false)
			}
		}

		loadMembers()
	}, [])

	return {
		members,
		loading,
		open,
		selectedMember,
		handleOpenDelete,
		handleToggleStatus,
		handleOnDelete,
		handleOnClose,
	}
}
