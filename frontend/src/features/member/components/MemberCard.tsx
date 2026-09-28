"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Lock, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Card } from "@/src/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { cn } from "@/src/lib/utils"
import { MemberProps } from "@/src/types"
import { getInitials } from "../../dashboard/utils"
import { useMemberCard } from "../hooks/useMemberCard"
import { AlertDialogDestructive } from "./AlertDialog"

const ROLE_STYLES: Record<string, string> = {
	Responsável: "bg-income-soft text-income",
	Administrador: "bg-muted text-foreground",
	Membro: "border text-muted-foreground",
}

const joinedLabel = (date: string) =>
	`Na família desde ${format(parseISO(date), "MMM 'de' yyyy", { locale: ptBR })}`

const MemberItem = ({
	member,
	onToggleStatus,
	onDelete,
}: {
	member: MemberProps
	onToggleStatus: (member: MemberProps) => void
	onDelete: (member: MemberProps) => void
}) => (
	<Card className="gap-4 px-5 py-5">
		<div className="flex items-start gap-3">
			<Avatar className={cn("size-12", !member.is_active && "opacity-50 grayscale")}>
				<AvatarImage src={member.avatar} alt="" />
				<AvatarFallback>{getInitials(member.name)}</AvatarFallback>
			</Avatar>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate font-semibold">{member.name}</span>
				<span className="truncate text-sm text-muted-foreground">{member.email}</span>
			</div>

			{member.role === "Responsável" ? (
				<span
					className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground"
					title="O responsável pela família não pode ser desativado nem removido"
				>
					<Lock className="size-3.5" aria-label="O responsável pela família não pode ser desativado nem removido" />
				</span>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label={`Ações de ${member.name}`}
						className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
					>
						<MoreHorizontal className="size-4" />
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Ações</DropdownMenuLabel>

							<DropdownMenuItem onClick={() => onToggleStatus(member)}>
								{member.is_active ? "Desativar membro" : "Reativar membro"}
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem
								variant="destructive"
								onClick={() => onDelete(member)}
							>
								Remover da família
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>

		<div className="flex flex-wrap items-center gap-2">
			<span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ROLE_STYLES[member.role] ?? ROLE_STYLES.Membro)}>
				{member.role}
			</span>

			<span
				className={cn(
					"flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
					member.is_active ? "text-income" : "bg-expense-soft text-expense-strong"
				)}
			>
				<span className={cn("size-1.5 rounded-full", member.is_active ? "bg-income" : "bg-expense")} />
				{member.is_active ? "Ativo" : "Inativo"}
			</span>
		</div>

		<p className="border-t pt-3 text-xs text-muted-foreground first-letter:uppercase">
			{joinedLabel(member.joined_at)}
		</p>
	</Card>
)

export const MemberCard = () => {
	const {
		members,
		loading,
		open,
		selectedMember,
		handleOpenDelete,
		handleToggleStatus,
		handleOnDelete,
		handleOnClose,
	} = useMemberCard()

	const active = members.filter((member) => member.is_active).length

	return (
		<div className="flex flex-col gap-4">
			{!loading && members.length > 0 && (
				<p className="text-sm text-muted-foreground">
					{members.length} {members.length === 1 ? "membro" : "membros"} além de você ·{" "}
					{active} {active === 1 ? "ativo" : "ativos"}
				</p>
			)}

			{loading && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2].map((item) => (
						<div key={item} className="h-40 animate-pulse rounded-xl bg-muted" />
					))}
				</div>
			)}

			{!loading && !members.length && (
				<Card className="items-center gap-2 px-6 py-12 text-center">
					<p className="font-medium">Ainda não há outros membros na família.</p>
					<p className="text-sm text-muted-foreground">
						Convide alguém para dividir as finanças com você.
					</p>
				</Card>
			)}

			{!loading && members.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{members.map((member) => (
						<MemberItem
							key={member.id}
							member={member}
							onToggleStatus={handleToggleStatus}
							onDelete={handleOpenDelete}
						/>
					))}
				</div>
			)}

			<AlertDialogDestructive
				open={open}
				memberName={selectedMember?.name}
				handleOnDelete={handleOnDelete}
				handleOnClose={handleOnClose}
			/>
		</div>
	)
}
