"use client"

import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react"
import Link from "next/link"
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
	href?: string
}

const SummaryCard = ({
	title,
	value,
	icon: Icon,
	iconClassName,
	footer,
	loaded,
	className,
	href,
}: SummaryCardProps) => {
	const card = (
	<Card className={cn("gap-3 px-5 py-5", href ? "h-full transition-colors hover:bg-muted/50" : className)}>
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

	if (!href) return card

	return (
		<Link href={href} className={cn("block rounded-xl focus-visible:outline-2 focus-visible:outline-ring", className)}>
			{card}
		</Link>
	)
}

export const SummaryCards = ({
	filters,
	trend,
}: SummaryCardsProps) => {
	const {
		loaded,
		income,
		expense,
	} = useSummaryCards(filters)

	return (
		<div className="grid grid-cols-2 gap-4">
			<SummaryCard
				title="Receitas"
				href="/finance?type=INCOME"
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
				href="/finance?type=EXPENSE"
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
		</div>
	)
}
