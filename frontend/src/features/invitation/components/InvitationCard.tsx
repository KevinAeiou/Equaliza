"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, CheckCircle2, Clock, Copy, Mail, MoreHorizontal } from "lucide-react"
import { useState } from "react"
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
import { InviteProps } from "@/src/types"
import { useInvitationCard } from "../hooks/useInvitationCard"

interface InvitationCardProps {
	refresh: number
}

type StatusFilter = "Todos" | "Pendente" | "Aceito" | "Expirado"

const TABS: { value: StatusFilter, label: string }[] = [
	{ value: "Todos", label: "Todos" },
	{ value: "Pendente", label: "Pendentes" },
	{ value: "Aceito", label: "Aceitos" },
	{ value: "Expirado", label: "Expirados" },
]

const STATUS = {
	Pendente: { icon: Mail, iconClassName: "bg-muted text-foreground", badgeClassName: "bg-muted text-foreground" },
	Aceito: { icon: CheckCircle2, iconClassName: "bg-income-soft text-income", badgeClassName: "bg-income-soft text-income" },
	Expirado: { icon: Clock, iconClassName: "bg-expense-soft text-expense-strong", badgeClassName: "bg-expense-soft text-expense-strong" },
} as const

const day = (date: string) => format(parseISO(date), "d 'de' MMM", { locale: ptBR })

const describe = (invite: InviteProps) => {
	const sent = `Enviado em ${day(invite.created_at)}`

	if (invite.status === "Aceito" && invite.accepted_at) return `${sent} · aceito em ${day(invite.accepted_at)}`
	if (invite.status === "Expirado") return `${sent} · expirou em ${day(invite.expires_at)}`

	return `${sent} · expira em ${day(invite.expires_at)}`
}

const CopyLinkButton = ({ link }: { link: string }) => {
	const [copied, setCopied] = useState<boolean>(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(link)
		setCopied(true)

		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Button
			variant="outline"
			size="sm"
			className="h-8 gap-1.5"
			onClick={handleCopy}
		>
			{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
			<span className="hidden sm:inline">{copied ? "Copiado" : "Copiar link"}</span>
			<span className="sr-only sm:hidden">{copied ? "Link copiado" : "Copiar link do convite"}</span>
		</Button>
	)
}

export const InvitationCard = ({
	refresh,
}: InvitationCardProps) => {
	const {
		loading,
		invites,
		handleDeleteInvitation,
	} = useInvitationCard({ refresh })

	const [filter, setFilter] = useState<StatusFilter>("Todos")

	const count = (value: StatusFilter) =>
		value === "Todos" ? invites.length : invites.filter((invite) => invite.status === value).length

	const visible = filter === "Todos" ? invites : invites.filter((invite) => invite.status === filter)

	return (
		<div className="flex flex-col gap-4">
			<div role="tablist" aria-label="Status do convite" className="flex gap-1 rounded-lg bg-muted p-1 sm:self-start">
				{TABS.map((tab) => {
					const selected = filter === tab.value

					return (
						<button
							key={tab.value}
							type="button"
							role="tab"
							aria-selected={selected}
							onClick={() => setFilter(tab.value)}
							className={cn(
								"flex h-9 flex-1 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3",
								selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
							)}
						>
							{tab.label}
							<span className="text-xs text-muted-foreground tabular-nums">{loading ? "" : count(tab.value)}</span>
						</button>
					)
				})}
			</div>

			<Card className="gap-0 py-0">
				{loading && (
					<p className="px-6 py-10 text-center text-sm text-muted-foreground">Carregando convites...</p>
				)}

				{!loading && !visible.length && (
					<div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
						<p className="font-medium">
							{invites.length ? "Nenhum convite com este status." : "Nenhum convite enviado ainda."}
						</p>
						{!invites.length && (
							<p className="text-sm text-muted-foreground">
								Convide alguém para participar das finanças da família.
							</p>
						)}
					</div>
				)}

				{!loading && visible.map((invite) => {
					const status = STATUS[invite.status as keyof typeof STATUS] ?? STATUS.Pendente
					const Icon = status.icon
					const pending = invite.status === "Pendente"

					return (
						<div
							key={invite.id}
							className="flex items-center gap-3 border-t px-4 py-3.5 first:border-t-0 sm:px-6"
						>
							<span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", status.iconClassName)}>
								<Icon className="size-4" />
							</span>

							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<div className="flex min-w-0 items-center gap-2">
									<span className="truncate text-sm font-medium">{invite.email || "Convite sem e-mail"}</span>
									<span className={cn("hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline", status.badgeClassName)}>
										{invite.status}
									</span>
								</div>

								<span className="truncate text-xs text-muted-foreground">{describe(invite)}</span>
							</div>

							{pending && <CopyLinkButton link={invite.link} />}

							<DropdownMenu>
								<DropdownMenuTrigger
									aria-label={`Ações do convite para ${invite.email ?? "sem e-mail"}`}
									className="inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal className="size-4" />
								</DropdownMenuTrigger>

								<DropdownMenuContent align="end">
									<DropdownMenuGroup>
										<DropdownMenuLabel>Ações</DropdownMenuLabel>

										{pending && (
											<>
												<DropdownMenuItem
													render={<a href={invite.link} target="_blank" rel="noopener noreferrer" />}
												>
													Abrir link do convite
												</DropdownMenuItem>

												<DropdownMenuSeparator />
											</>
										)}

										<DropdownMenuItem
											variant="destructive"
											onClick={() => handleDeleteInvitation(invite)}
										>
											{pending ? "Cancelar convite" : "Excluir do histórico"}
										</DropdownMenuItem>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				})}
			</Card>
		</div>
	)
}
