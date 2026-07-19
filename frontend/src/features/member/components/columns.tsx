"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { MemberProps } from "@/src/types"

export const columns = (
	onDelete: (member: MemberProps) => void,
	onToggleStatus: (member: MemberProps) => void,
): ColumnDef<MemberProps>[] => [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Nome
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "email",
			header: () => (
				<Button
					variant="ghost"
				>
					E-mail
				</Button>
			),
		},
		{
			accessorKey: "role",
			header: () => (
				<Button
					variant="ghost"
				>
					Função
				</Button>
			),
			cell: ({ row }) => {
				const role = row.original.role

				const variant = {
					Responsável: "default",
					Administrador: "secondary",
					Membro: "outline",
				}[role] as
					| "default"
					| "secondary"
					| "outline"

				return (
					<Badge variant={variant}>
						{role}
					</Badge>
				)
			},
		},
		{
			accessorKey: "joined_at",
			header: () => (
				<Button
					variant="ghost"
				>
					Entrou em
				</Button>
			),
			cell: ({ row }) => {
				const date = new Date(row.original.joined_at)

				return new Intl.DateTimeFormat("pt-BR", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				})
					.format(date)
					.replace(",", "")
			},
		},
		{
			accessorKey: "is_active",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Status
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<Badge
					variant={
						row.original.is_active
							? "default"
							: "secondary"
					}
				>
					{row.original.is_active ? "Ativo" : "Inativo"}
				</Badge>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const member = row.original

				return (
					<DropdownMenu>
						<DropdownMenuTrigger>
							<span className="sr-only">Abrir opções</span>

							<MoreHorizontal className="h-4 w-4" />
						</DropdownMenuTrigger>

						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuLabel>Ações</DropdownMenuLabel>

								<DropdownMenuItem
									onClick={() => onToggleStatus(member)}
								>
									{member.is_active
										? "Desativar membro"
										: "Ativar membro"}
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
				)
			},
		},
	]