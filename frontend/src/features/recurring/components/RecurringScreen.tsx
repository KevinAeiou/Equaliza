"use client"

import Link from "next/link"
import { ArrowLeft, Lock, MoreHorizontal, Plus, Repeat } from "lucide-react"
import { HeaderScreen } from "@/src/components/headerScreen"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Switch } from "@/src/components/ui/switch"
import { cn, formatCurrency } from "@/src/lib/utils"
import { useRecurringScreen } from "../hooks/useRecurringScreen"
import { describeSchedule, formatShortDate } from "../utils"
import { DeleteRecurringDialog } from "./DeleteRecurringDialog"
import { RecurringDialog } from "./RecurringDialog"

export const RecurringScreen = () => {
	const {
		items,
		loading,
		userId,
		activeCount,
		pausedCount,
		open, setOpen,
		recurringId, setRecurringId,
		toDelete, setToDelete,
		onCreate,
		onEdit,
		onToggle,
		onConfirmDelete,
		reload,
	} = useRecurringScreen()

	return (
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-2">
					<Link
						href="/finance"
						className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						Finanças
					</Link>

					<HeaderScreen
						title="Recorrentes"
						subtitle="Lançamentos que se repetem automaticamente."
					/>
				</div>

				<Button onClick={onCreate} className="h-10 w-full gap-2 sm:w-auto">
					<Plus className="size-4" />
					Nova recorrente
				</Button>
			</div>

			<Card className="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
				<CardContent className="flex flex-col px-0">
					{loading ? (
						<p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
					) : items.length === 0 ? (
						<p className="p-6 text-center text-sm text-muted-foreground">
							Nenhuma recorrente cadastrada.
						</p>
					) : (
						<ul>
							{items.map((item) => {
								const income = item.type === "INCOME"
								const isOwner = item.created_by?.id === userId
								const title = item.description || item.category.name

								return (
									<li
										key={item.id}
										className={cn(
											"flex items-center gap-3 border-t px-3 py-2.5 first:border-t-0 sm:px-4",
											!item.is_active && "opacity-60"
										)}
									>
										<span
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-lg",
												income ? "bg-income-soft text-income" : "bg-expense-soft text-expense-strong"
											)}
										>
											<Repeat className="size-4" />
										</span>

										<div className="flex min-w-0 flex-1 flex-col">
											<div className="flex items-baseline justify-between gap-2">
												<span className="truncate text-sm font-medium">{title}</span>
												<span
													className={cn(
														"text-sm font-semibold whitespace-nowrap tabular-nums",
														income && "text-income"
													)}
												>
													{income ? "+" : "−"}{formatCurrency(Number(item.amount))}
												</span>
											</div>

											<span className="truncate text-xs text-muted-foreground">
												{item.category.name} · {describeSchedule(item.frequency, item.start_date)}
											</span>

											<span className="truncate text-xs text-muted-foreground">
												{item.is_active
													? `Próxima: ${formatShortDate(item.next_date)}${item.end_date ? ` · até ${formatShortDate(item.end_date)}` : ""}`
													: "Pausada · sem novos lançamentos"}
											</span>
										</div>

										{isOwner ? (
											<>
												<Switch
													aria-label={`${item.is_active ? "Pausar" : "Ativar"} ${title}`}
													checked={item.is_active}
													onCheckedChange={(value) => onToggle(item, value)}
												/>

												<DropdownMenu>
													<DropdownMenuTrigger
														aria-label={`Ações de ${title}`}
														className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
													>
														<MoreHorizontal className="size-4" />
													</DropdownMenuTrigger>

													<DropdownMenuContent align="end">
														<DropdownMenuGroup>
															<DropdownMenuLabel>Ações</DropdownMenuLabel>

															<DropdownMenuItem onClick={() => onEdit(item)}>
																Editar
															</DropdownMenuItem>

															<DropdownMenuSeparator />

															<DropdownMenuItem
																variant="destructive"
																onClick={() => setToDelete(item)}
															>
																Excluir
															</DropdownMenuItem>
														</DropdownMenuGroup>
													</DropdownMenuContent>
												</DropdownMenu>
											</>
										) : (
											<span
												className="inline-flex size-8 items-center justify-center text-muted-foreground"
												title="Apenas quem registrou pode editar ou excluir"
											>
												<Lock
													className="size-3.5"
													aria-label="Apenas quem registrou pode editar ou excluir"
												/>
											</span>
										)}
									</li>
								)
							})}
						</ul>
					)}
				</CardContent>

				{!loading && items.length > 0 && (
					<div className="border-t px-4 py-3 text-sm text-muted-foreground">
						{activeCount} {activeCount === 1 ? "ativa" : "ativas"}
						{pausedCount > 0 && ` · ${pausedCount} ${pausedCount === 1 ? "pausada" : "pausadas"}`}
					</div>
				)}
			</Card>

			<RecurringDialog
				open={open}
				setOpen={setOpen}
				recurringId={recurringId}
				setRecurringId={setRecurringId}
				onSuccess={reload}
				onDelete={setToDelete}
			/>

			<DeleteRecurringDialog
				recurring={toDelete}
				onConfirm={onConfirmDelete}
				onClose={() => setToDelete(undefined)}
			/>
		</section>
	)
}
