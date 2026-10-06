"use client"

import {
	CalendarClock,
	CalendarDays,
	CircleCheck,
	Info,
	LucideIcon,
	PiggyBank,
	Receipt,
	Target,
	TrendingDown,
	TrendingUp,
	TriangleAlert,
	PieChart,
	Hourglass,
} from "lucide-react"
import { createElement } from "react"
import { Card } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"
import {
	DashboardInsightProps,
	DashboardInsightsReportProps,
	InsightKind,
	InsightTone,
} from "@/src/types"

// Quantos períodos anteriores com despesas são necessários para falar em "média".
const MIN_HISTORY_PERIODS = 2

const TONES: Record<InsightTone, { badge: string; text: string; bar: string }> = {
	alert: { badge: "bg-destructive/10 text-destructive", text: "text-destructive", bar: "bg-destructive" },
	warning: { badge: "bg-expense-soft text-expense-strong", text: "text-expense-strong", bar: "bg-expense" },
	good: { badge: "bg-income-soft text-income", text: "text-income", bar: "bg-income" },
	neutral: { badge: "bg-muted text-muted-foreground", text: "text-muted-foreground", bar: "bg-muted-foreground" },
}

const ICONS: Record<InsightKind, LucideIcon> = {
	above_average: TriangleAlert,
	below_average: Target,
	drop: TrendingDown,
	rise: TrendingUp,
	trend: TrendingUp,
	total_change: TrendingUp,
	largest_expense: Receipt,
	concentration: PieChart,
	savings: PiggyBank,
	projection: Hourglass,
	weekday: CalendarDays,
	upcoming: CalendarClock,
}

const Track = ({ fraction, className }: { fraction: number; className: string }) => (
	<div className="h-2.5 overflow-hidden rounded-full bg-muted">
		<div
			className={cn("h-full rounded-full", className)}
			style={{ width: `${Math.min(Math.max(Number.isFinite(fraction) ? fraction : 0, 0), 1) * 100}%` }}
		/>
	</div>
)

const InsightCard = ({ insight }: { insight: DashboardInsightProps }) => {
	const tone = TONES[insight.tone]

	return (
		<Card className="min-w-0 gap-0 px-5 py-5">
			<div className="flex items-center gap-2.5">
				<span className={cn("rounded-lg p-2", tone.badge)}>
					{insight.kind === "total_change" && insight.tone === "good"
						? <TrendingDown className="size-4" />
						: createElement(ICONS[insight.kind], { className: "size-4" })}
				</span>

				<span className={cn("text-xs font-semibold uppercase tracking-wider", tone.text)}>
					{insight.tag}
				</span>
			</div>

			<h3 className="mt-3.5 text-lg leading-snug font-semibold tracking-tight text-balance">
				{insight.title}
			</h3>

			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				{insight.body}
			</p>

			{insight.bars.length > 0 && (
				<div className="mt-4 flex flex-col gap-2.5">
					{insight.bars.map((bar) => (
						<div key={bar.label} className="flex flex-col gap-1.5">
							<div className="flex items-baseline justify-between gap-3 text-sm">
								<span className="text-muted-foreground">{bar.label}</span>
								<span className="font-semibold tabular-nums">{bar.value}</span>
							</div>

							<Track
								fraction={bar.fraction}
								className={bar.highlighted ? tone.bar : "bg-muted-foreground"}
							/>
						</div>
					))}
				</div>
			)}

			{insight.progress && (
				<div className="mt-4 flex flex-col gap-2">
					<Track fraction={insight.progress.fraction} className={tone.bar} />

					<div className="flex justify-between gap-3 text-sm text-muted-foreground tabular-nums">
						<span className="truncate">{insight.progress.start}</span>
						<span className="truncate text-right">{insight.progress.end}</span>
					</div>
				</div>
			)}

			{insight.spark.length > 0 && (
				<div className="mt-4 flex items-end gap-2 sm:gap-3">
					{insight.spark.map((point) => (
						<div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
							<span
								className={cn(
									"max-w-full truncate text-[11px] font-semibold tabular-nums",
									point.highlighted ? tone.text : "text-muted-foreground"
								)}
							>
								{point.value}
							</span>

							<div
								className={cn("w-full rounded-md", point.highlighted ? tone.bar : "bg-muted")}
								style={{ height: Math.max(point.fraction * 64, 4) }}
							/>

							<span className="text-xs text-muted-foreground">{point.label}</span>
						</div>
					))}
				</div>
			)}

			{insight.note && (
				<p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
					{insight.note}
				</p>
			)}
		</Card>
	)
}

const Stat = ({ count, singular, plural, tone }: { count: number; singular: string; plural: string; tone: InsightTone }) => (
	<Card className="gap-1 px-4 py-4">
		<span
			className={cn(
				"text-2xl font-semibold tabular-nums sm:text-3xl",
				tone === "neutral" ? "text-foreground" : TONES[tone].text
			)}
		>
			{count}
		</span>

		<span className="text-xs text-muted-foreground sm:text-sm">
			{count === 1 ? singular : plural}
		</span>
	</Card>
)

const Notice = ({ icon: Icon, tone, title, children }: { icon: LucideIcon; tone: InsightTone; title: string; children: string }) => (
	<Card className={cn("flex-row items-start gap-3 px-5 py-5", tone === "neutral" && "bg-muted ring-0")}>
		<span className={cn("shrink-0 rounded-lg p-2", TONES[tone].badge)}>
			<Icon className="size-4" />
		</span>

		<div className="flex flex-col gap-1">
			<p className="font-semibold">{title}</p>
			<p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
		</div>
	</Card>
)

const Skeleton = () => (
	<Card className="gap-3 px-5 py-5">
		<div className="h-6 w-36 animate-pulse rounded-md bg-muted" />
		<div className="h-6 w-full animate-pulse rounded-md bg-muted" />
		<div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
		<div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
	</Card>
)

interface DashboardInsightsProps {
	report?: DashboardInsightsReportProps
	error?: string
	onRetry: () => void
}

export const DashboardInsights = ({ report, error, onRetry }: DashboardInsightsProps) => {
	const stats = report
		? [
			...(report.has_history
				? [
					{ count: report.above_count, singular: "categoria acima da média", plural: "categorias acima da média", tone: "warning" as const },
					{ count: report.below_count, singular: "categoria abaixo da média", plural: "categorias abaixo da média", tone: "good" as const },
				]
				: []),
			...(report.has_previous
				? [{ count: report.dropped_count, singular: "categoria em queda", plural: "categorias em queda", tone: "neutral" as const }]
				: []),
		]
		: []

	const found = !report
		? ""
		: report.history_periods === 0
			? "Ainda não há despesas em períodos anteriores."
			: report.history_periods === 1
				? "Encontramos despesas em apenas 1 período anterior."
				: `Encontramos despesas em ${report.history_periods} períodos anteriores.`

	return (
		<section className="flex flex-col gap-3.5">
			<div>
				<h2 className="text-lg font-semibold">Insights</h2>

				<p className="text-sm text-muted-foreground">
					O que mudou nos seus gastos e onde vale prestar atenção.
				</p>
			</div>

			{error && !report && (
				<Card className="items-start gap-2 px-5 py-5">
					<p className="font-semibold">Não foi possível carregar os insights</p>
					<p className="text-sm text-muted-foreground">{error}</p>

					<button
						type="button"
						onClick={onRetry}
						className="text-sm font-medium text-income hover:underline"
					>
						Tentar novamente
					</button>
				</Card>
			)}

			{!error && !report && (
				<div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
					<Skeleton />
					<Skeleton />
					<Skeleton />
				</div>
			)}

			{report && !report.has_expenses && (
				<Card className="gap-1 px-5 py-5">
					<p className="font-semibold">Sem despesas no período</p>

					<p className="text-sm text-muted-foreground">
						Registre despesas ou escolha outro período para ver insights sobre os seus gastos.
					</p>
				</Card>
			)}

			{report?.has_expenses && (
				<>
					{stats.length > 0 && (
						<div className={cn("grid gap-4 sm:gap-6", stats.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
							{stats.map((stat) => (
								<Stat key={stat.plural} {...stat} />
							))}
						</div>
					)}

					{!report.has_history && (
						<Notice icon={Info} tone="neutral" title="Histórico insuficiente">
							{`${found} Para comparar com a média, são necessárias despesas em pelo menos ${MIN_HISTORY_PERIODS} períodos anteriores. Conforme você registra mais gastos, novos insights aparecem aqui.`}
						</Notice>
					)}

					{report.insights.length === 0 && report.has_history ? (
						<Notice icon={CircleCheck} tone="good" title="Tudo dentro do esperado">
							Nenhuma categoria se afastou da sua média e não há mudanças relevantes em relação ao período anterior.
						</Notice>
					) : (
						<div className="grid items-start gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
							{report.insights.map((insight) => (
								<InsightCard key={`${insight.kind}-${insight.title}`} insight={insight} />
							))}
						</div>
					)}
				</>
			)}
		</section>
	)
}
