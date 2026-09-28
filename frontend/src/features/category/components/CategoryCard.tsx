"use client"

import { ArrowDownRight, ArrowUpRight, Lock, MoreHorizontal, Tag } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
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
import { CategoryProps, FinanceEntryType } from "@/src/types"
import { useCategoryCard } from "../hooks/useCategoryCard"
import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"

interface CategoryCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedCategory: (category: CategoryProps) => void
	filters: FormCategoryFilterSchemaType
}

const SECTIONS: { type: FinanceEntryType, title: string, icon: typeof ArrowUpRight, iconClassName: string }[] = [
	{ type: "EXPENSE", title: "Despesas", icon: ArrowDownRight, iconClassName: "bg-expense-soft text-expense-strong" },
	{ type: "INCOME", title: "Receitas", icon: ArrowUpRight, iconClassName: "bg-income-soft text-income" },
]

const usageLabel = (count?: number | null) => {
	if (count === null || count === undefined) return null
	if (count === 0) return "Sem lançamentos"

	return `${count} ${count === 1 ? "lançamento" : "lançamentos"}`
}

export const CategoryCard = ({
	refresh,
	setOpen,
	setSelectedCategory,
	filters,
}: CategoryCardProps) => {
	const {
		categories,
		loading,
		canManage,
		handleEditCategory,
		handleDeleteCategory,
	} = useCategoryCard({ refresh, setOpen, setSelectedCategory, filters })

	const sections = SECTIONS.filter((section) => !filters.type || section.type === filters.type)

	return (
		<div className={cn("grid gap-4 sm:gap-6", sections.length > 1 && "xl:grid-cols-2")}>
			{sections.map(({ type, title, icon: Icon, iconClassName }) => {
				const items = categories.filter((category) => category.type === type)

				return (
					<Card key={type} className="min-w-0 gap-2">
						<CardHeader>
							<div className="flex items-center gap-3">
								<span className={cn("flex size-9 items-center justify-center rounded-lg", iconClassName)}>
									<Icon className="size-4" />
								</span>

								<div className="flex flex-col gap-0.5">
									<CardTitle className="font-semibold">{title}</CardTitle>
									<CardDescription>
										{loading
											? "Carregando..."
											: `${items.length} ${items.length === 1 ? "categoria" : "categorias"}`}
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex flex-col">
							{!loading && !items.length && (
								<p className="py-6 text-center text-sm text-muted-foreground">
									Nenhuma categoria encontrada.
								</p>
							)}

							{items.map((category) => {
								const locked = category.is_default || !canManage
								const lockReason = category.is_default
									? "Categorias padrão do sistema não podem ser alteradas"
									: "Apenas responsáveis e administradores podem alterar categorias"
								const inUse = (category.usage_count ?? 0) > 0

								return (
									<div
										key={category.id}
										className="flex items-center gap-3 border-t py-3 first:border-t-0"
									>
										<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
											<Tag className="size-4" />
										</span>

										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium">{category.name}</span>

											<span className="text-xs text-muted-foreground">
												{category.is_default ? "Padrão do sistema" : "Criada pela família"}
											</span>
										</div>

										<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
											{usageLabel(category.usage_count)}
										</span>

										{locked ? (
											<span
												className="inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground"
												title={lockReason}
											>
												<Lock className="size-3.5" aria-label={lockReason} />
											</span>
										) : (
											<DropdownMenu>
												<DropdownMenuTrigger
													aria-label={`Ações de ${category.name}`}
													className="inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
												>
													<MoreHorizontal className="size-4" />
												</DropdownMenuTrigger>

												<DropdownMenuContent align="end">
													<DropdownMenuGroup>
														<DropdownMenuLabel>Ações</DropdownMenuLabel>

														<DropdownMenuItem onClick={() => handleEditCategory(category)}>
															Editar
														</DropdownMenuItem>

														<DropdownMenuSeparator />

														<DropdownMenuItem
															variant="destructive"
															disabled={inUse}
															onClick={() => handleDeleteCategory(category)}
														>
															{inUse ? "Em uso, não pode ser excluída" : "Excluir"}
														</DropdownMenuItem>
													</DropdownMenuGroup>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								)
							})}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
