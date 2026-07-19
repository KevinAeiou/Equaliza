"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Tag } from "lucide-react"

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

import { Finance } from "../hooks/useFinanceTable"
import { FinanceEntryType as FinanceEntryType } from "@/src/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export const columns = (
	onDelete: (finance: Finance) => void,
	onEdit: (finance: Finance) => void,
	type: FinanceEntryType,
): ColumnDef<Finance>[] => [
		{
			accessorKey: "category",
			header: "Categoria",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Tag className="size-4 text-muted-foreground" />

					<span>
						{"category" in row.original
							? row.original.category.name
							: "-"}
					</span>
				</div>
			),
		},

		{
			accessorKey: "amount",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Valor
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			),
			cell: ({ row }) => (
				<span className="font-semibold">
					{new Intl.NumberFormat("pt-BR", {
						style: "currency",
						currency: "BRL",
					}).format(Number(row.original.amount))}
				</span>
			),
		},

		{
			accessorKey: "date",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Data
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			),
			cell: ({ row }) =>
				format(parseISO(row.original.date), "dd/MM/yyyy", {
					locale: ptBR,
				})
		},

		{
			id: "actions",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<MoreHorizontal className="size-4" />
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel>
								Ações
							</DropdownMenuLabel>

							<DropdownMenuItem
								onClick={() => onEdit(row.original)}
							>
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