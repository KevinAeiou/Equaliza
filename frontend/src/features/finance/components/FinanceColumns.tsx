"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, Lock, MoreHorizontal } from "lucide-react"

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
import { cn, formatCurrency } from "@/src/lib/utils"
import { FinanceEntryType } from "@/src/types"

import { getFirstName, getInitials } from "../../dashboard/utils"
import { Finance } from "../hooks/useFinanceCard"

const formatEntryDate = (date: string) =>
	format(parseISO(date), "d MMM yyyy", { locale: ptBR })

const SortHeader = ({ label, onClick, className }: { label: string, onClick: () => void, className?: string }) => (
	<Button
		variant="ghost"
		size="sm"
		className={cn("-mx-2 gap-1.5 text-muted-foreground", className)}
		onClick={onClick}
	>
		{label}
		<ArrowUpDown className="size-3.5" />
	</Button>
)

export const columns = (
	onDelete: (finance: Finance) => void,
	onEdit: (finance: Finance) => void,
	type: FinanceEntryType,
	currentUserId: number,
): ColumnDef<Finance>[] => {
	const income = type === "INCOME"
	const Icon = income ? ArrowUpRight : ArrowDownRight

	const authorLabel = (finance: Finance) => {
		const author = finance.created_by

		if (!author) return "-"

		return author.id === currentUserId ? "Você" : author.name
	}

	return [
		{
			id: "category",
			accessorFn: (row) => row.category.name,
			header: () => <span className="text-muted-foreground">Movimentação</span>,
			// max-w-0 + w-full: a coluna ocupa o espaço que sobra e trunca o texto, sem empurrar o valor.
			meta: { className: "w-full max-w-0" },
			cell: ({ row }) => (
				<div className="flex min-w-0 items-center gap-3 py-1">
					<span
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-lg",
							income ? "bg-income-soft text-income" : "bg-expense-soft text-expense-strong"
						)}
					>
						<Icon className="size-4" />
					</span>

					<div className="flex min-w-0 flex-col">
						<span className="truncate font-medium">
							{row.original.description || row.original.category.name}
						</span>

						<span className="truncate text-xs text-muted-foreground">
							{row.original.description ? row.original.category.name : "Sem observação"}
							<span className="md:hidden">
								{" · "}{formatEntryDate(row.original.date)}
								{row.original.created_by && ` · ${getFirstName(authorLabel(row.original))}`}
							</span>
						</span>
					</div>
				</div>
			),
		},

		{
			id: "author",
			accessorFn: authorLabel,
			header: () => <span className="text-muted-foreground">Registrado por</span>,
			meta: { className: "hidden md:table-cell" },
			cell: ({ row }) => {
				const label = authorLabel(row.original)

				return (
					<div className="flex items-center gap-2.5">
						<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
							{getInitials(row.original.created_by?.name ?? "")}
						</span>

						<span className={cn(label === "Você" && "font-medium")}>{label}</span>
					</div>
				)
			},
		},

		{
			accessorKey: "date",
			meta: { className: "hidden md:table-cell" },
			header: ({ column }) => (
				<SortHeader
					label="Data"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				/>
			),
			cell: ({ row }) => (
				<span className="text-muted-foreground tabular-nums">
					{formatEntryDate(row.original.date)}
				</span>
			),
		},

		{
			accessorKey: "amount",
			sortingFn: (a, b) => Number(a.original.amount) - Number(b.original.amount),
			meta: { className: "text-right" },
			header: ({ column }) => (
				<SortHeader
					label="Valor"
					className="ml-auto"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				/>
			),
			cell: ({ row }) => (
				<span className={cn("font-semibold whitespace-nowrap tabular-nums", income && "text-income")}>
					{income ? "+" : "−"}{formatCurrency(Number(row.original.amount))}
				</span>
			),
		},

		{
			id: "actions",
			meta: { className: "w-12 text-right" },
			// Só quem registrou pode alterar ou remover; o backend também bloqueia.
			cell: ({ row }) => row.original.created_by?.id !== currentUserId ? (
				<span
					className="inline-flex size-8 items-center justify-center text-muted-foreground"
					title="Apenas quem registrou pode editar ou excluir"
				>
					<Lock className="size-3.5" aria-label="Apenas quem registrou pode editar ou excluir" />
				</span>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label="Ações"
						className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
					>
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
}
