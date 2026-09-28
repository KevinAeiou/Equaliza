"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, MoreHorizontal, Users } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
import { FamilyProps, UserRole } from "@/src/types"
import { getInitials } from "../../dashboard/utils"
import { useFamilyCard } from "../hooks/useFamilyCard"
import { DeleteFamilyDialog } from "./DeleteFamilyDialog"

interface FamilyCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedFamily: (family: FamilyProps) => void
}

const ROLE_STYLES: Record<string, string> = {
	[UserRole.OWNER]: "bg-income-soft text-income",
	[UserRole.ADMIN]: "bg-muted text-foreground",
	[UserRole.MEMBER]: "border text-muted-foreground",
}

// Tira o prefixo "Família" para que o monograma mostre o sobrenome ("Família Souza" → "S").
const monogram = (name: string) => getInitials(name.replace(/^fam[ií]lia\s+/i, "")).slice(0, 2) || "F"

export const FamilyCard = ({
	refresh,
	setOpen,
	setSelectedFamily,
}: FamilyCardProps) => {
	const {
		families,
		loading,
		currentFamilyId,
		familyToDelete,
		setFamilyToDelete,
		handleEditFamily,
		handleConfirmDelete,
		handleUseFamily,
	} = useFamilyCard({ refresh, setOpen, setSelectedFamily })

	if (loading) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{[0, 1].map((item) => (
					<div key={item} className="h-48 animate-pulse rounded-xl bg-muted" />
				))}
			</div>
		)
	}

	if (!families.length) {
		return (
			<Card className="items-center gap-2 px-6 py-12 text-center">
				<p className="font-medium">Você ainda não participa de nenhuma família.</p>
				<p className="text-sm text-muted-foreground">
					Crie uma família ou peça um convite para começar a organizar as finanças.
				</p>
			</Card>
		)
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{[...families]
					.sort((a, b) => Number(b.id === currentFamilyId) - Number(a.id === currentFamilyId))
					.map((family) => {
						const current = family.id === currentFamilyId
						const owner = family.role === UserRole.OWNER

						return (
							<Card
								key={family.id}
								className={cn("gap-5 px-5 py-5", current && "ring-2 ring-brand")}
							>
								<div className="flex items-start gap-3">
									<span
										className={cn(
											"flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold",
											current ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"
										)}
									>
										{monogram(family.name)}
									</span>

									<div className="flex min-w-0 flex-1 flex-col gap-1.5">
										<span className="truncate font-semibold">{family.name}</span>

										<div className="flex flex-wrap items-center gap-2">
											{family.role && (
												<span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ROLE_STYLES[family.role])}>
													{family.role}
												</span>
											)}

											{current && (
												<span className="flex items-center gap-1 text-xs font-medium text-income">
													<Check className="size-3.5" />
													Família atual
												</span>
											)}
										</div>
									</div>

									{owner && (
										<DropdownMenu>
											<DropdownMenuTrigger
												aria-label={`Ações de ${family.name}`}
												className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
											>
												<MoreHorizontal className="size-4" />
											</DropdownMenuTrigger>

											<DropdownMenuContent align="end">
												<DropdownMenuGroup>
													<DropdownMenuLabel>Ações</DropdownMenuLabel>

													<DropdownMenuItem onClick={() => handleEditFamily(family)}>
														Renomear
													</DropdownMenuItem>

													<DropdownMenuSeparator />

													<DropdownMenuItem
														variant="destructive"
														onClick={() => setFamilyToDelete(family)}
													>
														Excluir família
													</DropdownMenuItem>
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>

								<div className="flex items-center gap-4 text-sm text-muted-foreground">
									<span className="flex items-center gap-1.5">
										<Users className="size-4" />
										{family.members_count} {family.members_count === 1 ? "membro ativo" : "membros ativos"}
									</span>

									<span>
										Criada em {format(parseISO(family.created_at), "MMM 'de' yyyy", { locale: ptBR })}
									</span>
								</div>

								<div className="mt-auto border-t pt-4">
									{current ? (
										<p className="text-sm text-muted-foreground">
											Os dados exibidos no app são desta família.
										</p>
									) : family.is_active_member ? (
										<Button
											variant="outline"
											className="h-9 w-full"
											onClick={() => handleUseFamily(family)}
										>
											Usar esta família
										</Button>
									) : (
										<p className="text-sm text-expense-strong">
											Seu acesso a esta família está desativado.
										</p>
									)}
								</div>
							</Card>
						)
					})}
			</div>

			<DeleteFamilyDialog
				familyName={familyToDelete?.name}
				onConfirm={handleConfirmDelete}
				onClose={() => setFamilyToDelete(null)}
			/>
		</>
	)
}
