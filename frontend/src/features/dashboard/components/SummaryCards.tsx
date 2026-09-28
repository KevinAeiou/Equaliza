"use client"

import { ArrowDownRight, ArrowUpRight, LucideIcon, PiggyBank, Wallet } from "lucide-react"
import { ReactNode } from "react"
import { Card } from "@/src/components/ui/card"
import { cn, formatCurrency } from "@/src/lib/utils"
import { useSummaryCards } from "../hooks/useSummaryCards"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { TrendPoint } from "../utils"
import { Sparkline } from "./Sparkline"

interface SummaryCardsProps {
	filters: FormDashboardFilterSchemaType
	trend?: TrendPoint[]
}

interface SummaryCardProps {
	title: string
	value: string
	icon: LucideIcon
	iconClassName: string
	footer: ReactNode
	loaded: boolean
	className?: string
}

const SummaryCard = ({
	title,
	value,
	icon: Icon,
	iconClassName,
	footer,
	loaded,
	className,
}: SummaryCardProps) => (
	<Card className={cn("gap-3 px-5 py-5", className)}>
		<div className="flex items-center justify-between gap-2">
			<span className="text-sm font-medium text-muted-foreground">
				{title}
			</span>

			<span className={cn("rounded-lg p-2", iconClassName)}>
				<Icon className="size-4" />
			</span>
		</div>

		{loaded ? (
			<p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
				{value}
			</p>
		) : (
			<div className="h-8 w-2/3 animate-pulse rounded-md bg-muted sm:h-9" />
		)}

		<div className="flex min-h-7 items-center justify-between gap-2 text-sm text-muted-foreground">
			{footer}
		</div>
	</Card>
)

export const SummaryCards = ({
	filters,
	trend,
}: SummaryCardsProps) => {
	const {
		loaded,
		income,
		expense,
		balance,
		savingsRate,
	} = useSummaryCards(filters)

	const savings = savingsRate === null
		? "—"
		: new Intl.NumberFormat("pt-BR", {
			style: "percent",
			maximumFractionDigits: 1,
		}).format(savingsRate)

	return (
		<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
			<Card className="col-span-2 gap-3 bg-brand px-5 py-5 text-brand-foreground ring-0 xl:col-span-1">
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-medium">Saldo do período</span>

					<span className="rounded-lg bg-white/15 p-2">
						<Wallet className="size-4" />
					</span>
				</div>

				{loaded ? (
					<p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
						{formatCurrency(balance)}
					</p>
				) : (
					<div className="h-8 w-2/3 animate-pulse rounded-md bg-white/20 sm:h-9" />
				)}

				<p className="flex min-h-7 items-center text-sm text-white/80">
					Receitas menos despesas
				</p>
			</Card>

			<SummaryCard
				title="Receitas"
				value={formatCurrency(income)}
				icon={ArrowUpRight}
				iconClassName="bg-income-soft text-income"
				loaded={loaded}
				footer={(
					<>
						<span className="hidden sm:inline">Últimos 6 meses</span>
						<Sparkline
							values={trend?.map((point) => point.income) ?? []}
							className="hidden text-income sm:block"
						/>
					</>
				)}
			/>

			<SummaryCard
				title="Despesas"
				value={formatCurrency(expense)}
				icon={ArrowDownRight}
				iconClassName="bg-expense-soft text-expense-strong"
				loaded={loaded}
				footer={(
					<>
						<span className="hidden sm:inline">Últimos 6 meses</span>
						<Sparkline
							values={trend?.map((point) => point.expense) ?? []}
							className="hidden text-expense sm:block"
						/>
					</>
				)}
			/>

			<SummaryCard
				title="Poupança"
				value={savings}
				icon={PiggyBank}
				iconClassName="bg-income-soft text-income"
				loaded={loaded}
				className="col-span-2 xl:col-span-1"
				footer={(
					<>
						<span>da receita guardada</span>
						<div className="h-2 w-24 overflow-hidden rounded-full bg-income-soft">
							<div
								className="h-full rounded-full bg-income"
								style={{ width: `${Math.min(Math.max(savingsRate ?? 0, 0), 1) * 100}%` }}
							/>
						</div>
					</>
				)}
			/>
		</div>
	)
}
