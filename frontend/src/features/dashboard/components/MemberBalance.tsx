"use client"

import { ArrowRight } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
import { cn, formatCurrency } from "@/src/lib/utils"
import { DashboardChartsProps } from "@/src/types"
import { buildSettlements, getFirstName, getInitials } from "../utils"

interface MemberBalanceProps {
	data?: DashboardChartsProps["member_contributions"]
	className?: string
}

const signedCurrency = (value: number) =>
	`${value >= 0 ? "+" : "−"}${formatCurrency(Math.abs(value))}`

export const MemberBalance = ({
	data,
	className,
}: MemberBalanceProps) => {
	const members = (data ?? []).map((item) => ({
		member: item.member,
		expected: Number(item.expected),
		paid: Number(item.paid),
		difference: Number(item.difference),
	}))

	const totalExpected = members.reduce((sum, item) => sum + item.expected, 0)
	const scale = Math.max(...members.flatMap((item) => [item.expected, item.paid]), 0) * 1.08
	const settlements = buildSettlements(data ?? [])

	return (
		<Card className={cn("min-w-0", className)}>
			<CardHeader>
				<CardTitle className="font-semibold">Divisão entre membros</CardTitle>

				<CardDescription>
					Quanto cada um pagou em relação à sua cota, que é proporcional à receita de cada membro.
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col">
				{!members.length && (
					<p className="text-sm text-muted-foreground">
						Nenhum membro com movimentações no período.
					</p>
				)}

				{members.map((item) => {
					const above = item.difference >= 0
					const share = totalExpected ? Math.round((item.expected / totalExpected) * 100) : 0

					return (
						<div
							key={item.member}
							className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 border-t py-4 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_1fr_auto]"
						>
							<div className="flex min-w-0 items-center gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
									{getInitials(item.member)}
								</span>

								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium">{item.member}</span>
									<span className="text-xs text-muted-foreground">Cota de {share}%</span>
								</div>
							</div>

							<div className="col-span-2 flex flex-col gap-2 sm:col-span-1 sm:row-start-1 sm:col-start-2">
								<div className="relative h-2.5 rounded-full bg-muted">
									<div
										className={cn("absolute inset-y-0 left-0 rounded-full", above ? "bg-income" : "bg-expense")}
										style={{ width: `${scale ? (item.paid / scale) * 100 : 0}%` }}
									/>

									<div
										className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-foreground"
										style={{ left: `${scale ? (item.expected / scale) * 100 : 0}%` }}
										title="Cota esperada"
									/>
								</div>

								<span className="text-xs text-muted-foreground tabular-nums">
									Pagou <span className="font-medium text-foreground">{formatCurrency(item.paid)}</span> de {formatCurrency(item.expected)}
								</span>
							</div>

							<span
								className={cn(
									"row-start-1 col-start-2 justify-self-end rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap tabular-nums sm:col-start-3",
									above ? "bg-income-soft text-income" : "bg-expense-soft text-expense-strong"
								)}
							>
								{signedCurrency(item.difference)}
							</span>
						</div>
					)
				})}

				{settlements.length > 0 && (
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted px-4 py-3 text-sm">
						<span className="font-semibold">Para equilibrar</span>

						{settlements.map((item) => (
							<span key={`${item.from}-${item.to}`} className="flex items-center gap-1.5">
								{getFirstName(item.from)}
								<ArrowRight className="size-3.5 text-muted-foreground" aria-label="transfere para" />
								{getFirstName(item.to)}
								<span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
							</span>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
