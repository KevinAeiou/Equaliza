"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, Copy, ExternalLink, MoreHorizontal } from "lucide-react"

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

import { InviteProps } from "@/src/types"
import { Badge } from "@/src/components/ui/badge"
import { useState } from "react"

const LinkCell = ({ link }: { link: string }) => {
	const [copied, setCopied] = useState<boolean>(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(link)
		setCopied(true)

		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={handleCopy}
			>
				{copied ? (
					<>
						<Check className="mr-2 h-4 w-4" />
						Copiado
					</>
				) : (
					<>
						<Copy className="mr-2 h-4 w-4" />
						Copiar
					</>
				)}
			</Button>

			<Button
				variant="ghost"
				size="icon"
			>
				<a
					href={link}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLink className="h-4 w-4" />
				</a>
			</Button>
		</div>
	)
}

export const columns = (
	onDelete: (invite: InviteProps) => void,
): ColumnDef<InviteProps>[] => [
		{
			accessorKey: "email",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					E-mail
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "link",
			header: "Link",
			cell: ({ row }) => {
				return <LinkCell link={row.original.link} />
			},
		},
		{
			accessorKey: "expires_at",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Expira em
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => {
				const date = new Date(row.original.expires_at)

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
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => {
				const status = row.original.status

				const variant = {
					"Aceito": "default",
					"Pendente": "secondary",
					"Expirado": "destructive",
				}[status] as "default" | "secondary" | "destructive"

				return (
					<Badge variant={variant}>
						{status}
					</Badge>
				)
			},
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<span className="sr-only">Abrir opções</span>
						<MoreHorizontal />
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Ações</DropdownMenuLabel>

							<DropdownMenuItem disabled>
								Editar
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem
								variant="destructive"
								onClick={() => onDelete(row.original)}
							>
								Excluir
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	]