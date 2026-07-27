import { isApiError } from "@/src/lib/utils"
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MemberService } from "../services/member.service"
import { columns } from "../components/columns"
import { MemberProps } from "@/src/types"


export const useMemberCard = () => {
	const [members, setMembers] = useState<MemberProps[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [sorting, setSorting] = useState<SortingState>([])
	const [open, setOpen] = useState(false)
	const [selectedMember, setSelectedMember] = useState<MemberProps | null>(null)

	const handleOnDelete = async () => {
		if (!selectedMember) return

		try {
			await MemberService.delete(selectedMember.id)

			setMembers((current) =>
				current.filter((item) => item.id !== selectedMember.id)
			)

			toast.success("Membro excluído com sucesso.")

			handleOnClose()
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro ao excluir membro."

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

			toast.success(`Status alterado com sucesso!`)
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: "Erro desconhecido ao alterar o status do membro"

			toast.error(message)
		} finally {
			setLoading(false)
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

	const table = useReactTable({
		data: members,
		columns: columns(
			handleOpenDelete,
			handleToggleStatus,
		),
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	useEffect(() => {
		const loadMembers = async () => {
			setLoading(true)

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
		table,
		loading,
		open,
		handleOnDelete,
		handleOnClose,
	}
}