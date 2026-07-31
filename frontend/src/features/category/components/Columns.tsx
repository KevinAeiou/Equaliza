"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

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

import { CategoryProps } from "@/src/types"

export const columns = (
	onEdit: (category: CategoryProps) => void,
	onDelete: (category: CategoryProps) => void,
): ColumnDef<CategoryProps>[] => [
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
			accessorKey: "type",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Tipo
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => {
				const types: Record<string, string> = {
					EXPENSE: "Despesa",
					INCOME: "Receita",
				}

				return types[row.original.type] ?? row.original.type
			},
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<span className="sr-only">Abrir opções</span>
						<MoreHorizontal className="h-4 w-4" />
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Ações</DropdownMenuLabel>

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