"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
import { cn, formatCurrency } from "@/src/lib/utils"
import { useRecentTransactions } from "../hooks/useRecentTransactions"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

interface RecentTransactionsProps {
	filters: FormDashboardFilterSchemaType
}

export const RecentTransactions = ({
	filters,
}: RecentTransactionsProps) => {
	const { transactions } = useRecentTransactions(filters)

	return (
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="font-semibold">Últimas movimentações</CardTitle>

				<CardDescription>Da família, mais recentes primeiro</CardDescription>

				<CardAction>
					<Link
						href="/finance"
						className="text-sm font-medium text-income hover:underline"
					>
						Ver todas
					</Link>
				</CardAction>
			</CardHeader>

			<CardContent className="flex flex-col">
				{transactions?.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Nenhuma movimentação no período.
					</p>
				)}

				{transactions?.map((item) => {
					const income = item.type === "INCOME"
					const Icon = income ? ArrowUpRight : ArrowDownRight

					return (
						<div
							key={item.id}
							className="flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0"
						>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-lg",
									income ? "bg-income-soft text-income" : "bg-expense-soft text-expense-strong"
								)}
							>
								<Icon className="size-4" />
							</span>

							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-sm font-medium">{item.description}</span>

								<span className="text-xs text-muted-foreground">
									{[item.category, format(parseISO(item.date), "d MMM", { locale: ptBR }), item.author]
										.filter(Boolean)
										.join(" · ")}
								</span>
							</div>

							<span
								className={cn(
									"shrink-0 text-sm font-semibold tabular-nums",
									income && "text-income"
								)}
							>
								{income ? "+" : "−"}{formatCurrency(item.amount)}
							</span>
						</div>
					)
				})}
			</CardContent>
		</Card>
	)
}
